"use server";

import { parse, HTMLElement } from "node-html-parser";

type Source = "nyTimes" | "seriousEats" | "bonAppetit" | "epicurious";

type RecipeData = {
  title?: string;
  author?: string;
  link?: string;
  img?: string;
  time?: string;
  rating?: string;
  ratingCount?: string;
};

type Recipe = RecipeData & { source: Source };

type QueryMap = Record<
  keyof RecipeData,
  {
    selectors: string[];
    callback?: (els: HTMLElement[]) => string;
    query?: "single" | "all";
  }
>;

const queries: Record<Source, QueryMap> = {
  nyTimes: {
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
        `https://cooking.nytimes.com/${els[0].getAttribute("href")}`,
    },
    img: {
      selectors: ['img[class^="cardimage_image"]', "a figure img"],
      callback: (els) => els[0].getAttribute("src") ?? "",
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
      query: "all",
      callback: (els) => els.length.toString(),
    },
    ratingCount: {
      selectors: [
        'div[class^="recipecard_recipeCardRating"] p[class^="pantry--ui-xs"]',
        'a section div[class*="rating"] p',
      ],
    },
  },
  seriousEats: {
    title: { selectors: [] },
    author: { selectors: [] },
    link: { selectors: [] },
    img: { selectors: [] },
    time: { selectors: [] },
    rating: { selectors: [] },
    ratingCount: { selectors: [] },
  },
  bonAppetit: {
    title: { selectors: [] },
    author: { selectors: [] },
    link: { selectors: [] },
    img: { selectors: [] },
    time: { selectors: [] },
    rating: { selectors: [] },
    ratingCount: { selectors: [] },
  },
  epicurious: {
    title: { selectors: [] },
    author: { selectors: [] },
    link: { selectors: [] },
    img: { selectors: [] },
    time: { selectors: [] },
    rating: { selectors: [] },
    ratingCount: { selectors: [] },
  },
};

function extractRecipeData(source: Source, root: HTMLElement) {
  const selectorKeys = queries[source];

  return {
    source,
    ...Object.keys(selectorKeys).reduce<RecipeData>((acc, key) => {
      const __key = key as keyof RecipeData;
      const { selectors, callback } = selectorKeys[__key];

      acc[__key] = selectors.reduce<string>((val, sel) => {
        if (val) return val;

        const els = root.querySelectorAll(sel);

        if (els.length) return callback ? callback(els) : els[0].rawText;

        return "";
      }, "");

      return acc;
    }, {}),
  };
}

export async function search(formData: FormData) {
  const query = extract(formData.get("search"));

  return Promise.all([
    queryNyTimes(query),
    querySeriousEats(query),
    queryBonAppetit(query),
    queryEpicurious(query),
  ]);
}

function extract(value: FormDataEntryValue | null): string {
  return value && typeof value === "string" ? value : "";
}

async function queryNyTimes(query: string): Promise<Recipe[]> {
  const res = await fetch("https://cooking.nytimes.com/search?q=" + query);
  const html = await res.text();
  const root = parse(html);
  const cards = root.querySelectorAll('article[class*="card"]');

  return cards.map((card) => extractRecipeData("nyTimes", card));
}
async function querySeriousEats(query: string) {
  return query;
}
async function queryBonAppetit(query: string) {
  return query;
}
async function queryEpicurious(query: string) {
  return query;
}
