import { EpicuriousRecipe } from "@/types";
import { PartialRecord, removeQueryParams } from "@/util";
import { capitalize } from "lodash";
import { HTMLElement as ParserHTMLElement } from "node-html-parser";
import he from "he";

export const sources = [
  "newYorkTimesCooking",
  "epicurious",
  "bonAppetit",
  "seriousEats",
] as const;
export type Source = (typeof sources)[number];

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
  source: "newYorkTimesCooking" | "seriousEats";
  /** All queries created by Claude AI */
  queries: QueryMap;
  rootSelector: string;
}

export interface ScriptQuery extends BaseQuery {
  source: "bonAppetit" | "epicurious";
  extractor: (source: Source, root: ParserHTMLElement) => Recipe[];
}

export type Query = HTMLQuery | ScriptQuery;

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
          removeQueryParams(
            `https://cooking.nytimes.com${els[0].getAttribute("href")}`
          ),
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
        callback: (els) => removeQueryParams(els[0].getAttribute("href")!),
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
    .replace(/\;/g, "");

  try {
    const data = JSON.parse(str);
    const items: EpicuriousRecipe[] = data.transformed.search.items;

    return items.map((item) => {
      return {
        title: he.decode(item.dangerousHed),
        description: he.decode(item.dangerousDek),
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
