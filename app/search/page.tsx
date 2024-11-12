import { param } from "@/util";
import { redirect } from "next/navigation";

import { fetchRecipeData } from "./actions";
import View from "./components/view";

export default async function Search({
  searchParams,
}: {
  searchParams: { [param]: string };
}) {
  const query = searchParams[param];
  if (!query) redirect("/");

  const data = await fetchRecipeData(query);

  return <View data={data} />;
}
