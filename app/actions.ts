"use server";

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

async function queryNyTimes(query: string) {
  const res = await fetch("https://cooking.nytimes.com/search?q=" + query);
  const html = await res.text();

  console.log(html);
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
