import { PartialRecord } from "@/util";
import { HTMLElement as ParserHTMLElement } from "node-html-parser";

export const sources = [
  "nyTimes",
  "seriousEats",
  "bonAppetit",
  "epicurious",
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
};

export type Recipe = Pick<RecipeData, "title" | "img" | "link"> & {
  description?: string;
  meta: {
    rating?: number;
    ratingCount?: number;
    time?: string;
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

const condeNastQueries: QueryMap = {
  title: { selectors: ["h2"] },
  description: { selectors: ["h2 + div"] },
  link: { selectors: ['a[href^="/recipe/"]'] },
  rating: { selectors: ['[role="group"][aria-label="Rating"]'] },
  img: { selectors: ["img.responsive-image__image"] },
};
const condeNastSelector = "[class^='search_result_item']";

/** All queries created by Claude AI */
export const queries: Record<
  Source,
  { queries: QueryMap; url: (q: string) => string; rootSelector: string }
> = {
  nyTimes: {
    url: (q) => "https://cooking.nytimes.com/search?q=" + q,
    rootSelector: 'article[class*="card"]',
    queries: {
      title: { selectors: ['h3[class^="pantry--ui-strong"]', "a h3"] },
      author: {
        selectors: [
          'p[class^="pantry--ui-sm recipecard_byline"]',
          "a section p:nth-child(2)",
        ],
      },
      link: {
        selectors: ['a[class^="link"]', "a"],
        callback: (els) =>
          `https://cooking.nytimes.com${els[0].getAttribute("href")}`,
      },
      img: {
        selectors: ['img[class^="cardimage_image"]', "a figure img"],
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
    },
  },
  seriousEats: {
    url: (q) => "https://www.seriouseats.com/search?q=" + q,
    rootSelector: ".card-list__item",
    queries: {
      title: { selectors: [".card__title .card__underline"] },
      author: {
        selectors: [".card__author-name"],
        callback: (els) =>
          els[0].getAttribute("data-byline-author")!.replace(/by/, "").trim(),
      },
      link: {
        selectors: ["a"],
        callback: (els) => els[0].getAttribute("href")!,
      },
      img: {
        selectors: [".card__media img"],
        callback: (els) => els[0].getAttribute("src")!,
      },
    },
  },
  bonAppetit: {
    url: (q) => `https://www.bonappetit.com/search?q=${q}&content=recipe`,
    rootSelector: condeNastSelector,
    queries: condeNastQueries,
  },
  epicurious: {
    url: (q) => `https://www.epicurious.com/search?q=${q}&content=recipe`,
    rootSelector: condeNastSelector,
    queries: condeNastQueries,
  },
};
