import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { parse } from "node-html-parser";
import { z } from "zod";

export async function extractRecipe(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;

  const html = await res.text();
  const root = parse(html);

  const el = root.querySelector(".recipe");
  if (!el) return null;

  const htmlString = el.toString();

  const { object } = await generateObject({
    model: anthropic("claude-3-5-haiku-latest"),
    schemaName: "recipe",
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        image: z.string(),
        ingredients: z.array(z.string()),
        steps: z.array(z.string()),
      }),
    }),
    system: "You are an expert at parsing out HTML",
    prompt: `Given the following HTML, can you please parse out the recipe?\n\n${htmlString}`,
  });

  console.log(object);

  console.log(await res.json());
}
