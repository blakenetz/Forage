import {
  EpicuriousRecipe,
  OttolenghiRecipe,
  OttolenghiRecipesResponse,
} from "@/types";
import { PartialRecord } from "@/util";
import { capitalize } from "lodash";
import { HTMLElement as ParserHTMLElement } from "node-html-parser";
import { decode } from "he";

export const sources = [
  "newYorkTimesCooking",
  "epicurious",
  "bonAppetit",
  "seriousEats",
  "ottolenghi",
  "mollyBaz",
] as const;
export type Source = (typeof sources)[number];

export const placeholderImg =
  "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=3475&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

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

export type Recipe = Pick<RecipeData, "title" | "img" | "link"> & {
  description?: string;
  author?: string;
  meta: {
    rating?: number;
    ratingCount?: number;
    time?: string;
    tags?: string;
  };
};

export type Results = Record<Source, Recipe[]>;

type QueryMap = PartialRecord<
  keyof RecipeData,
  {
    selectors: string[];
    callback?: (els: ParserHTMLElement[]) => string;
  }
>;

interface BaseQuery {
  source: Source;
  url: (q: string) => string;
}

export interface HTMLQuery extends BaseQuery {
  source: "newYorkTimesCooking" | "seriousEats" | "mollyBaz";
  /** All queries created by Claude AI */
  queries: QueryMap;
  rootSelector: string;
}

export interface ScriptQuery extends BaseQuery {
  source: "bonAppetit" | "epicurious";
  extractor: (source: Source, root: ParserHTMLElement) => Recipe[];
}

/** Sources searched through an API instead of a scraped search page */
interface APIQuery {
  source: "ottolenghi";
  search: (q: string) => Promise<Recipe[]>;
}

export type Query = HTMLQuery | ScriptQuery | APIQuery;

export const queries: Query[] = [
  {
    source: "newYorkTimesCooking",
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
      time: {
        selectors: [
          'p[class^="pantry--ui-xs recipecard_cookTime"]',
          "a section div p:last-child",
        ],
      },
      rating: {
        selectors: [
          'span[class^="recipecard_stars"] svg[class*="filledStar"]',
          'a section div[class*="rating"] span[class*="filledStar"]',
        ],
        callback: (els) => els.length.toString(),
      },
      ratingCount: {
        selectors: [
          'div[class^="recipecard_recipeCardRating"] p[class^="pantry--ui-xs"]',
          'a section div[class*="rating"] p',
        ],
      },
      tags: {
        selectors: ['a[class^="kickerlabel"]', 'a[href*="tag"]'],
      },
    },
  },
  {
    source: "seriousEats",
    url: (q) => "https://www.seriouseats.com/search?q=" + q,
    rootSelector: ".card-list__item",
    queries: {
      title: { selectors: [".card__title .card__underline"] },
      author: {
        selectors: [".card__author-name"],
        callback: (els) =>
          els[0].getAttribute("data-byline-author")!.replace(/by/i, "").trim(),
      },
      link: {
        selectors: ["a"],
        callback: (els) => els[0].getAttribute("href")!,
      },
      img: {
        selectors: [".card__media img", "img"],
        callback: (els) => els[0].getAttribute("data-src")!,
      },
    },
  },
  {
    source: "bonAppetit",
    url: (q) => `https://www.bonappetit.com/search?q=${q}&content=recipe`,
    extractor: epicuriousExtractor,
  },
  {
    source: "epicurious",
    url: (q) => `https://www.epicurious.com/search?q=${q}&content=recipe`,
    extractor: epicuriousExtractor,
  },
  {
    source: "mollyBaz",
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
        callback: (els) => els[0].getAttribute("src")!,
      },
    },
  },
  {
    source: "ottolenghi",
    search: ottolenghiSearch,
  },
];

function epicuriousExtractor(
  source: Source,
  root: ParserHTMLElement
): Recipe[] {
  const baseUrl = `https://${source.toLocaleLowerCase()}.com`;

  const filterPredicate = (el: ParserHTMLElement) =>
    !el.getAttribute("defer") && el.rawText.includes("__PRELOADED_STATE__");

  const scriptEl = root
    .querySelectorAll('script[type="text/javascript"]')
    .filter(filterPredicate)
    .pop();

  if (!scriptEl) {
    console.log(`Unable to find script el for ${source}`);
    return [];
  }

  const str = scriptEl.rawText
    .replace("window.__PRELOADED_STATE__ = ", "")
    .replace(/;/g, "");

  try {
    const data = JSON.parse(str);
    const items: EpicuriousRecipe[] = data.transformed.search.items;

    return items.map((item) => {
      return {
        title: decode(item.dangerousHed),
        description: decode(item.dangerousDek),
        author: item.contributors.author?.items
          .map((item) => item.name)
          .join(", "),
        img: item.image.sources.md.url,
        link: new URL(item.url, baseUrl).toString(),
        meta: {
          rating: item.rating,
          ratingCount: item.reviewsCount,
          tags: item.imageLabels.map(capitalize).join(", "),
        },
      };
    });
  } catch (error) {
    console.log(error);

    return [];
  }
}

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

/**
 * ottolenghi.co.uk has no server-side recipe search: its search page downloads
 * every recipe from the Storefront API and filters them in the browser.
 */
async function fetchOttolenghiRecipes(): Promise<OttolenghiRecipe[]> {
  const recipes: OttolenghiRecipe[] = [];
  let cursor: string | null = null;

  do {
    const res: Response = await fetch(ottolenghiStorefront.url, {
      method: "POST",
      headers: {
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
    const { nodes, pageInfo } = data.metaobjects;
    recipes.push(...nodes);
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor);

  return recipes;
}

/** Every search term must appear in the title or tags; title matches rank first */
async function ottolenghiSearch(query: string): Promise<Recipe[]> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  try {
    const recipes = await fetchOttolenghiRecipes();
    const titleMatches: Recipe[] = [];
    const tagMatches: Recipe[] = [];

    for (const recipe of recipes) {
      const title = recipe.title?.value;
      if (!title || !recipe.onlineStoreUrl) continue;

      const tags = [recipe.main_ingredient, recipe.meal, recipe.collection]
        .filter((field) => field !== null)
        .flatMap((field) => JSON.parse(field.value) as string[]);
      const titleText = title.toLowerCase();
      const allText = [titleText, ...tags].join(" ").toLowerCase();

      const result: Recipe = {
        title,
        description: recipe.description?.value,
        img: recipe.images?.references?.nodes[0]?.image?.url ?? placeholderImg,
        link: recipe.onlineStoreUrl,
        meta: { tags: tags.join(", ") || undefined },
      };

      if (terms.every((term) => titleText.includes(term)))
        titleMatches.push(result);
      else if (terms.every((term) => allText.includes(term)))
        tagMatches.push(result);
    }

    return [...titleMatches, ...tagMatches];
  } catch (error) {
    console.log(error);

    return [];
  }
}
