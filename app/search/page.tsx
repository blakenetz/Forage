import { param } from "@/util";
import { Title } from "@mantine/core";
import { redirect } from "next/navigation";

import { type NextRequest } from "next/server";
import styles from "./search.module.css";

import { fetchRecipeData } from "./actions";
import Grid from "./components/grid";

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

  return (
    <main className={styles.main}>
      <Title className={styles.title}>Recipeas!</Title>
      <Grid data={data} />
    </main>
  );
}
