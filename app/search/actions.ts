"use server";

import { parse, HTMLElement as ParserHTMLElement } from "node-html-parser";
import { HTMLQuery, Recipe, RecipeData, Source, sources } from "./data";
import { extractQuery } from "@/util";
import he from "he";

function extractRecipe(source: Source, root: ParserHTMLElement): RecipeData {
  const { queries: selectorKeys } = extractQuery<HTMLQuery>(source);

  return Object.keys(selectorKeys).reduce<RecipeData>(
    (acc, key) => {
      const __key = key as keyof RecipeData;
      const { selectors, callback } = selectorKeys[__key]!;

      const value = selectors.reduce<string>((val, sel) => {
        if (val) return val;

        const els = root.querySelectorAll(sel);

        if (els.length)
          return callback ? callback(els) : he.decode(els[0].rawText);

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
    description: data.description,
    author: data.author,
    meta: {
      rating: parseNumber(data.rating),
      ratingCount: parseNumber(data.ratingCount),
      time: data.time,
      tags: data.tags,
    },
  };
}

async function fetchRecipeDataBySource(source: Source, query: string) {
  const q = extractQuery(source);

  const res = await fetch(q.url(query));
  const html = await res.text();

  const root = parse(html);

  switch (q.source) {
    case "newYorkTimesCooking":
    case "seriousEats":
      const recipes = root.querySelectorAll(q.rootSelector);
      const extractor = extractRecipe.bind(null, source);

      return recipes.map(extractor).map(parseRecipeData);

    case "bonAppetit":
    case "epicurious":
      const extractFn = q.extractor.bind(null, source);
      return extractFn(root);

    default:
      return [];
  }
}

export async function fetchRecipeData(
  query: string
): Promise<Record<Source, Recipe[]>> {
  const data = await Promise.all(
    sources.map((source) => fetchRecipeDataBySource(source, query))
  );

  return data.reduce((acc, sourceData, i) => {
    const source = sources[i];
    acc[source] = sourceData;
    return acc;
  }, {} as Record<Source, Recipe[]>);
}
