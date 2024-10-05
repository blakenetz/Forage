"use server";

import { PartialRecord } from "@/util";
import { parse, HTMLElement } from "node-html-parser";

export type Source = "nyTimes" | "seriousEats" | "bonAppetit" | "epicurious";

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

function extractRecipe(source: Source, root: HTMLElement): RecipeData {
  const selectorKeys = queries[source];

  return Object.keys(selectorKeys).reduce<RecipeData>(
    (acc, key) => {
      const __key = key as keyof RecipeData;
      const { selectors, callback } = selectorKeys[__key]!;

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
      link: "",
    }
  );
}

function parseNumber(value: string | undefined): number | undefined {
  const number = Number(value);

  if (Number.isNaN(number)) return undefined;
  return number;
}

function parseRecipeData(data: RecipeData): Recipe {
  return {
    title: data.title,
    img: data.img,
    link: data.link,
    description: data.description ?? data.author,
    meta: {
      rating: parseNumber(data.rating),
      ratingCount: parseNumber(data.ratingCount),
      time: data.time,
    },
  };
}

export async function queryNyTimes(query: string): Promise<Recipe[]> {
  const res = await fetch("https://cooking.nytimes.com/search?q=" + query);
  const html = await res.text();
  const root = parse(html);

  const cards = root.querySelectorAll('article[class*="card"]');
  const extract = extractRecipe.bind(null, "nyTimes");

  return cards.map(extract).map(parseRecipeData);
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
