import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import ChapterHeading from "@/components/chapter-heading";
import fieldGuide from "@/components/field-guide.module.css";
import { PendingPlates, Plates } from "@/components/plates";
import SearchForm from "@/components/search-form";
import SourceSymbol from "@/components/source-symbol";
import { searchParam, sourceInfo, sources, type Source } from "@/sources";

import { searchSource } from "./search";
import styles from "./page.module.css";

const visiblePlates = 6;
const counted = ["no", "one", "two", "three", "four"];

async function Summary({ query }: { query: string }) {
  const results = await Promise.all(
    sources.map((source) => searchSource(source, query))
  );
  const total = results.reduce((sum, { recipes }) => sum + recipes.length, 0);
  const silent = sources.filter((_, i) => results[i].failed);
  const answered = sources.length - silent.length;

  if (!answered)
    return <p className={styles.summary}>No kitchen answered. Try again in a moment.</p>;

  const from =
    answered === sources.length
      ? "all four kitchens"
      : `${counted[answered]} of four kitchens`;
  const silentNames = new Intl.ListFormat("en", { type: "conjunction" }).format(
    silent.map((source) => sourceInfo[source].name)
  );

  return (
    <p className={styles.summary}>
      {total.toLocaleString("en-US")} {total === 1 ? "recipe" : "recipes"} from{" "}
      {from}.{silent.length > 0 && ` ${silentNames} didn’t answer this time.`}
    </p>
  );
}

async function KeyCount({ source, query }: { source: Source; query: string }) {
  const { recipes, failed } = await searchSource(source, query);

  return failed ? (
    <span className={styles.keyFailed}>no answer</span>
  ) : (
    <span className={styles.keyCount}>{recipes.length}</span>
  );
}

async function SourceResults({
  source,
  query,
}: {
  source: Source;
  query: string;
}) {
  const { recipes, failed } = await searchSource(source, query);
  const { name, domain } = sourceInfo[source];

  if (failed)
    return (
      <p className={styles.empty}>
        Nothing came back from {domain}. The site didn’t answer.
      </p>
    );

  if (!recipes.length)
    return (
      <p className={styles.empty}>
        No recipes for “{query}” in this kitchen.
      </p>
    );

  return (
    <Plates
      recipes={recipes}
      visible={visiblePlates}
      moreLabel={`All ${recipes.length} from ${name}`}
      eager={source === sources[0]}
    />
  );
}

/**
 * The shell (masthead, key and chapter headings) renders immediately; each
 * source's plates stream in as that site answers.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const param = (await searchParams)[searchParam];
  const query = typeof param === "string" ? param.trim() : "";
  if (!query) redirect("/");

  return (
    <main className={fieldGuide.page}>
      <header className={fieldGuide.masthead}>
        <Link href="/" className={fieldGuide.wordmark}>
          Forage
        </Link>
        <SearchForm query={query} />
      </header>

      <div className={styles.head}>
        <h1 className={styles.query}>{query}</h1>
        <Suspense
          fallback={<p className={styles.summary}>Searching four kitchens…</p>}
        >
          <Summary query={query} />
        </Suspense>
      </div>

      <nav className={styles.key} aria-label="Kitchens">
        {sources.map((source) => {
          const { name, symbol } = sourceInfo[source];

          return (
            <a key={source} href={`#${source}`}>
              <SourceSymbol symbol={symbol} />
              {name}
              <Suspense fallback={<span className={styles.keyCount}>…</span>}>
                <KeyCount source={source} query={query} />
              </Suspense>
            </a>
          );
        })}
      </nav>

      {sources.map((source) => (
        <section key={source} id={source} className={styles.chapter}>
          <ChapterHeading source={source} />
          <Suspense fallback={<PendingPlates count={visiblePlates} />}>
            <SourceResults source={source} query={query} />
          </Suspense>
        </section>
      ))}
    </main>
  );
}
