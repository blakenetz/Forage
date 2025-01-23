import { redirect } from "next/navigation";
import { extractRecipe } from "./actions";

export default async function Recipe(props: {
  searchParams: Promise<{ [url: string]: string }>;
}) {
  const searchParams = await props.searchParams;
  const { url } = searchParams;
  if (!url) redirect("/");

  const _data = await extractRecipe(url);

  return <div>hi</div>;
}
