"use server";

import { parse, HTMLElement } from "node-html-parser";

export type Source = "nyTimes" | "seriousEats" | "bonAppetit" | "epicurious";

export type Recipe = {
  title: string;
  author?: string;
  link?: string;
  img: string;
  time?: string;
  rating?: string;
  ratingCount?: string;
};
export type Results = Record<Source, Recipe[]>;

type QueryMap = Record<
  keyof Recipe,
  {
    selectors: string[];
    callback?: (els: HTMLElement[]) => string;
    query?: "single" | "all";
  }
>;

/** All queries created by Claude AI */
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
        `https://cooking.nytimes.com${els[0].getAttribute("href")}`,
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

function extractRecipe(source: Source, root: HTMLElement) {
  const selectorKeys = queries[source];

  const data = Object.keys(selectorKeys).reduce<Recipe>(
    (acc, key) => {
      const __key = key as keyof Recipe;
      const { selectors, callback } = selectorKeys[__key];

      const value = selectors.reduce<string>((val, sel) => {
        if (val) return val;

        const els = root.querySelectorAll(sel);

        if (els.length) return callback ? callback(els) : els[0].rawText;

        return "";
      }, "");

      acc[__key] = (value || acc[__key]) ?? "";

      return acc;
    },
    {
      title: "Unknown",
      img: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=3475&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    }
  );

  return {
    source,
    ...data,
  };
}

export async function queryNyTimes(query: string): Promise<Recipe[]> {
  const res = await fetch("https://cooking.nytimes.com/search?q=" + query);
  const html = await res.text();
  const root = parse(html);

  const cards = root.querySelectorAll('article[class*="card"]');

  return cards.map((card) => extractRecipe("nyTimes", card));
}
export async function querySeriousEats(_query: string): Promise<Recipe[]> {
  return [];
}
export async function queryBonAppetit(_query: string): Promise<Recipe[]> {
  return [];
}
export async function queryEpicurious(_query: string): Promise<Recipe[]> {
  return [];
}
