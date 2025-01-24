export async function fetchRecipeData(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;

  const html = await res.text();
  return parseRecipePage(html);
}

function parseRecipePage(html: string) {}
