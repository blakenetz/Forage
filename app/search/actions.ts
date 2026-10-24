"use server";

import { parse, HTMLElement as ParserHTMLElement } from "node-html-parser";
import {
  HTMLQuery,
  placeholderImg,
  Recipe,
  RecipeData,
  Source,
  sources,
} from "./data";
import { extractQuery } from "@/util";
import { decode } from "he";

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
          return callback ? callback(els) : decode(els[0].rawText);

        return "";
      }, "");

      acc[__key] = (value || acc[__key]) ?? "";

      return acc;
    },
    {
      title: "Unknown",
      img: placeholderImg,
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

async function fetchRecipeDataBySource(
  source: Source,
  query: string
): Promise<Recipe[]> {
  const q = extractQuery(source);
  if (q.source === "ottolenghi") return q.search(query);

  const res = await fetch(q.url(query));
  const html = await res.text();

  const root = parse(html);

  switch (q.source) {
    case "newYorkTimesCooking":
    case "seriousEats":
    case "mollyBaz":
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
