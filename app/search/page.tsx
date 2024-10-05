import { param } from "@/util";
import { Title, Accordion } from "@mantine/core";
import { redirect } from "next/navigation";

import { type NextRequest } from "next/server";
import styles from "./search.module.css";
import RecipeGrid from "./recipeGrid";
import { sources } from "./data";

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

  return (
    <main className={styles.main}>
      <Title>Recipeas!</Title>
      <Accordion variant="filled" defaultValue="nyTimes">
        {sources.map((source) => (
          <RecipeGrid key={source} source={source} query={query} />
        ))}
      </Accordion>
    </main>
  );
}
