"use server";

import { parse } from "node-html-parser";

type Recipe = {
  source: "nyTimes";
  title?: string;
  author?: string;
  link?: string;
  img?: string;
  time?: string;
  meta?: {
    rating?: number;
    ratingCount?: string;
  };
};

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
  const results = root.querySelectorAll('article[class*="card"]');

  return results.map((el) => {
    const link = el.querySelector("a")?.getAttribute("href");
    const img = el.querySelector("img");
    const titleEl = el.querySelector('[class*="cardTitle"]');
    const rating = el.querySelectorAll(
      '[class*="stars"] > svg[class*="filled"]'
    ).length;
    const ratingCount = Array.from(
      el.querySelector('[class*="recipeCardRating"]')?.childNodes ?? []
    ).find((v) => v.innerText && Number.isFinite(+v.innerText))?.innerText;

    return {
      source: "nyTimes",
      title: titleEl?.innerHTML,
      author: titleEl?.nextSibling?.innerText,
      link,
      img: img?.getAttribute("src") ?? img?.getAttribute("srcset"),
      time: el.querySelector('[class*="cookTime"]')?.innerText,
      meta: {
        rating,
        ratingCount,
      },
    };
  });
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
