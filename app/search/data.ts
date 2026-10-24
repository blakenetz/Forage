import type { OttolenghiRecipe, OttolenghiRecipesResponse } from "@/types";
import { requestHeaders, type Source } from "@/sources";
import type { HTMLElement as ParserHTMLElement } from "node-html-parser";

export type RecipeData = {
  title: string;
  img: string;
  link: string;
  author?: string;
  description?: string;
  time?: string;
  rating?: string;
  ratingCount?: string;
  tags?: string;
};

export type Recipe = Pick<RecipeData, "title" | "link"> & {
  img?: string;
  description?: string;
  author?: string;
  meta: {
    rating?: number;
    ratingCount?: number;
    time?: string;
    tags?: string;
  };
};

export type SearchResult = {
  recipes: Recipe[];
  /** the source errored or blocked us, as opposed to having no matches */
  failed: boolean;
};

type QueryMap = {
  [K in keyof RecipeData]?: {
    selectors: string[];
    callback?: (els: ParserHTMLElement[]) => string;
  };
};

export type HTMLSource = Exclude<Source, "ottolenghi">;

/** How to read recipe cards out of a listing page */
export interface CardQuery {
  rootSelector: string;
  /** All queries created by Claude AI */
  queries: QueryMap;
}

export interface HTMLQuery extends CardQuery {
  url: (q: string) => string;
}

/** Serious Eats renders search results and recipe listings with the same card */
const seriousEatsCard: QueryMap = {
  title: { selectors: [".card__title-text"] },
  author: {
    selectors: [".card__byline"],
    callback: ([byline]) =>
      (byline.getAttribute("data-byline") ?? "").replace(/^by\s+/i, ""),
  },
  link: {
    // each card is itself the link, and queries only see its descendants
    selectors: [".card__content"],
    callback: ([content]) => content.closest("a")?.getAttribute("href") ?? "",
  },
  img: {
    selectors: [".card__img"],
    callback: ([img]) => img.getAttribute("data-src") ?? "",
  },
};

/** Serious Eats' "All Recipes" listing, newest first */
export const seriousEatsNewest: CardQuery & { url: string } = {
  url: "https://www.seriouseats.com/all-recipes-5117985",
  rootSelector: ".mntl-three-post__inner a.card, .tax-sc__recirc-list a.card",
  queries: seriousEatsCard,
};

export const htmlQueries: Record<HTMLSource, HTMLQuery> = {
  newYorkTimesCooking: {
    url: (q) => "https://cooking.nytimes.com/search?q=" + q,
    rootSelector: 'li > [class*="recipecard"]',
    queries: {
      title: { selectors: ['h3[class^="pantry--ui-strong"]', "article a h3"] },
      author: {
        selectors: [
          'p[class^="pantry--ui-sm recipecard_byline"]',
          "a section p:nth-child(2)",
        ],
      },
      link: {
        selectors: ['a[class^="link"]', "article a"],
        callback: (els) =>
          `https://cooking.nytimes.com${els[0].getAttribute("href")}`,
      },
      img: {
        selectors: ['img[class^="cardimage_image"]', "article a figure img"],
        callback: (els) => els[0].getAttribute("src")!,
      },
      time: { selectors: ['p[class*="recipecard_cookTime"]'] },
      rating: {
        // "5138 ratings with an average rating of 4.5 out of 5 stars"
        selectors: ['span[class*="recipecard_ratingCaption"]'],
        callback: ([caption]) =>
          caption.rawText.match(/average rating of ([\d.]+)/)?.[1] ?? "",
      },
      ratingCount: { selectors: ['p[class*="recipecard_ratingLabel"]'] },
      tags: {
        selectors: ['a[class^="kickerlabel"]', 'a[href*="tag"]'],
      },
    },
  },
  seriousEats: {
    url: (q) =>
      "https://www.seriouseats.com/search?q=" + encodeURIComponent(q),
    rootSelector: ".mntl-search-results__list a.card",
    queries: seriousEatsCard,
  },
  mollyBaz: {
    url: (q) => "https://mollybaz.com/?s=" + encodeURIComponent(q),
    rootSelector: ".pp-content-grid-post",
    queries: {
      title: { selectors: [".pp-content-grid-post-title a"] },
      link: {
        selectors: [".pp-content-grid-post-title a"],
        // drop SearchWP click-tracking params
        callback: (els) => {
          const url = new URL(els[0].getAttribute("href")!);
          url.search = "";
          return url.toString();
        },
      },
      img: {
        selectors: [".pp-content-grid-post-image img"],
        // `src` is the full-size upload (often 2560px); use the ~650px srcset candidate
        callback: ([img]) => {
          const candidates = (img.getAttribute("srcset") ?? "")
            .split(",")
            .map((candidate) => candidate.trim().split(/\s+/))
            .map(([url, width]) => ({ url, width: parseInt(width) }))
            .filter(({ width }) => width >= 600)
            .sort((a, b) => a.width - b.width);
          return candidates[0]?.url ?? img.getAttribute("src")!;
        },
      },
    },
  },
};

const ottolenghiStorefront = {
  url: "https://ottolenghi-group.myshopify.com/api/2024-04/graphql.json",
  /** Public Storefront API token that ottolenghi.co.uk ships to every browser */
  token: "fc12e25a057a0638bff01d8db4e62311",
  query: `query ($cursor: String) {
    metaobjects(type: "recipes", first: 250, reverse: true, after: $cursor) {
      nodes {
        onlineStoreUrl
        title: field(key: "title") { value }
        description: field(key: "description") { value }
        main_ingredient: field(key: "main_ingredient") { value }
        meal: field(key: "meal") { value }
        collection: field(key: "collection") { value }
        season: field(key: "season") { value }
        images: field(key: "images") {
          references(first: 1) {
            nodes { ... on MediaImage { image { url(transform: { maxWidth: 650 }) } } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`,
};

export type OttolenghiEntry = {
  recipe: Recipe;
  tags: string[];
  seasons: string[];
};

/**
 * ottolenghi.co.uk has no server-side recipe search: its search page downloads
 * every recipe from the Storefront API and filters them in the browser.
 * Entries are newest first; unpublished recipes are skipped.
 */
export async function fetchOttolenghiCatalogue(): Promise<OttolenghiEntry[]> {
  const nodes: OttolenghiRecipe[] = [];
  let cursor: string | null = null;

  do {
    const res: Response = await fetch(ottolenghiStorefront.url, {
      method: "POST",
      headers: {
        ...requestHeaders,
        "content-type": "application/json",
        "x-shopify-storefront-access-token": ottolenghiStorefront.token,
      },
      body: JSON.stringify({
        query: ottolenghiStorefront.query,
        variables: { cursor },
      }),
      // the catalogue changes rarely; cache each page for a day
      next: { revalidate: 86400 },
    });
    if (!res.ok)
      throw new Error(`Ottolenghi storefront returned ${res.status}`);

    const { data }: OttolenghiRecipesResponse = await res.json();
    nodes.push(...data.metaobjects.nodes);
    const { pageInfo } = data.metaobjects;
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor);

  return nodes.flatMap((node) => {
    const title = node.title?.value;
    if (!title || !node.onlineStoreUrl) return [];

    const tags = [node.main_ingredient, node.meal, node.collection]
      .filter((field) => field !== null)
      .flatMap((field) => JSON.parse(field.value) as string[]);

    return {
      recipe: {
        title,
        description: node.description?.value,
        img: node.images?.references?.nodes[0]?.image?.url,
        link: node.onlineStoreUrl,
        meta: { tags: tags.join(", ") || undefined },
      },
      tags,
      seasons: node.season ? (JSON.parse(node.season.value) as string[]) : [],
    };
  });
}

/** Every search term must appear in the title or tags; title matches rank first */
export async function searchOttolenghi(query: string): Promise<SearchResult> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  try {
    const catalogue = await fetchOttolenghiCatalogue();
    const titleMatches: Recipe[] = [];
    const tagMatches: Recipe[] = [];

    for (const { recipe, tags } of catalogue) {
      const titleText = recipe.title.toLowerCase();
      const allText = [titleText, ...tags].join(" ").toLowerCase();

      if (terms.every((term) => titleText.includes(term)))
        titleMatches.push(recipe);
      else if (terms.every((term) => allText.includes(term)))
        tagMatches.push(recipe);
    }

    return { recipes: [...titleMatches, ...tagMatches], failed: false };
  } catch (error) {
    console.log(error);

    return { recipes: [], failed: true };
  }
}
