import { Source } from "@/data";

export async function fetchRecipeData(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;

  const html = await res.text();
  const source = getSourceFromUrl(url);
  if (!source) return null;

  return parseRecipePage(html, source);
}

function getSourceFromUrl(url: string): Source | null {
  if (url.includes("cooking.nytimes")) return "newYorkTimesCooking";
  if (url.includes("seriouseats")) return "seriousEats";
  if (url.includes("bonappetit")) return "bonAppetit";
  if (url.includes("epicurious")) return "epicurious";
  return null;
}

function parseRecipePage(html: string, source: Source) {
  switch (source) {
    case "newYorkTimesCooking":
    case "seriousEats":
      break;
    case "bonAppetit":
    case "epicurious":
      break;
    default:
      break;
  }
}
