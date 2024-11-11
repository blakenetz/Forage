import { param } from "@/util";
import { redirect } from "next/navigation";

import { type NextRequest } from "next/server";

import { fetchRecipeData } from "./actions";
import View from "./components/view";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get(param);
  if (!query) redirect("/");
  return query;
}

export default async function Search({
  searchParams,
}: {
  searchParams: { [param]: string };
}) {
  const query = searchParams[param];
  const data = await fetchRecipeData(query);

  return <View data={data} />;
}
