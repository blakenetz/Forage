import { decode } from "he";
import { parse, type HTMLElement as ParserHTMLElement } from "node-html-parser";
import { cache } from "react";

import { requestHeaders, type Source } from "@/sources";
import {
  htmlQueries,
  searchOttolenghi,
  type CardQuery,
  type HTMLQuery,
  type Recipe,
  type RecipeData,
  type SearchResult,
} from "./data";

function extractRecipe(
  { queries }: CardQuery,
  root: ParserHTMLElement
): RecipeData {
  return Object.keys(queries).reduce<RecipeData>(
    (acc, key) => {
      const __key = key as keyof RecipeData;
      const { selectors, callback } = queries[__key]!;

      const value = selectors.reduce<string>((val, sel) => {
        if (val) return val;

        const els = root.querySelectorAll(sel);

        if (els.length)
          return callback ? callback(els) : decode(els[0].rawText).trim();

        return "";
      }, "");

      acc[__key] = (value || acc[__key]) ?? "";

      return acc;
    },
    { title: "Unknown", img: "", link: "" }
  );
}

/** Reads counts like "5,138"; missing or unparseable values are undefined */
function parseNumber(value: string | undefined): number | undefined {
  const number = Number(value?.replace(/,/g, "") || NaN);

  if (Number.isNaN(number)) return undefined;
  return number;
}

/** Selectors that matched nothing leave empty strings; those become undefined */
function parseRecipeData(data: RecipeData): Recipe {
  return {
    title: data.title,
    img: data.img || undefined,
    link: data.link,
    description: data.description || undefined,
    author: data.author || undefined,
    meta: {
      rating: parseNumber(data.rating),
      ratingCount: parseNumber(data.ratingCount),
      time: data.time || undefined,
      tags: data.tags || undefined,
    },
  };
}

/** Reads every recipe card on a listing page */
export function parseCards(query: CardQuery, html: string): Recipe[] {
  return parse(html)
    .querySelectorAll(query.rootSelector)
    .map((el) => parseRecipeData(extractRecipe(query, el)));
}

async function searchHTML(query: HTMLQuery, q: string): Promise<SearchResult> {
  try {
    const res = await fetch(query.url(q), { headers: requestHeaders });
    if (!res.ok) return { recipes: [], failed: true };

    return { recipes: parseCards(query, await res.text()), failed: false };
  } catch (error) {
    console.log(error);

    return { recipes: [], failed: true };
  }
}

/**
 * Memoised per request, so the summary, the key and each streamed section
 * share a single fetch per source.
 */
export const searchSource = cache(
  (source: Source, q: string): Promise<SearchResult> =>
    source === "ottolenghi"
      ? searchOttolenghi(q)
      : searchHTML(htmlQueries[source], q)
);
