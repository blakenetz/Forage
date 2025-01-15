import { param } from "@/util";
import { redirect } from "next/navigation";

import { fetchRecipeData } from "./actions";
import View from "./components/view";

export default async function Search(
  props: {
    searchParams: Promise<{ [param]: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const query = searchParams[param];
  if (!query) redirect("/");

  const data = await fetchRecipeData(query);

  return <View data={data} />;
}
