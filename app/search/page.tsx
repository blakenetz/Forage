"use client";
import { param } from "@/util";
import { Title } from "@mantine/core";
import { redirect } from "next/navigation";

import { type NextRequest } from "next/server";
import styles from "./search.module.css";
import Grid from "./components/grid";
import { sources } from "./data";
import Aside from "./components/aside";
import { useState } from "react";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get(param);
  if (!query) redirect("/");
  return query;
}

export default function Search({
  searchParams,
}: {
  searchParams: { [param]: string };
}) {
  const [source, setSource] = useState(sources[0]);
  const query = searchParams[param];

  return (
    <main className={styles.main}>
      <Title className={styles.title}>Recipeas!</Title>
      <Aside />
      <Grid source={source} query={query} />
    </main>
  );
}
