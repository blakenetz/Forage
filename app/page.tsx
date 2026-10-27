import { cookies, headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import ChapterHeading from "@/components/chapter-heading";
import fieldGuide from "@/components/field-guide.module.css";
import { Plates } from "@/components/plates";
import SearchForm from "@/components/search-form";
import ZipForm from "@/components/zip-form";
import { getCollections } from "@/collections";
import { ingredientsOnSale } from "@/sales/data";
import { featuredIngredients } from "@/sales/ingredients";
import SalesChapter from "@/sales/sales-chapter";
import { inSeason } from "@/seasons";
import { searchParam, sourceInfo, sources } from "@/sources";
import { zipCookie, zipFor, zipParam } from "@/stores";

import styles from "./page.module.css";

/** The sales chapter follows the kitchens' */
const salesNumeral = "V";

/** Everything the landing page shows that depends on the source sites or today's date */
async function loadLanding() {
  const now = new Date();
  const chapters = await Promise.all(
    sources.map(async (source) => ({
      source,
      // each source's pages are cached for an hour
      collections: await getCollections(source),
    }))
  );

  return {
    edition: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
    seasonal: inSeason[now.getMonth()],
    chapters: chapters.filter(({ collections }) => collections.length),
  };
}

const searchLink = (term: string) =>
  `/search?${new URLSearchParams({ [searchParam]: term })}`;

/** Beside "In season now": the top ingredients on sale, as searches */
async function OnSale({ zip }: { zip: string }) {
  const ingredients = (await ingredientsOnSale(zip)).slice(0, featuredIngredients);

  return (
    <p className={styles.season}>
      <span className={fieldGuide.note}>On sale near {zip}:</span>
      {ingredients.map(({ term }) => (
        // a prefetch would run a search against every source
        <Link key={term} prefetch={false} href={searchLink(term)}>
          {term}
        </Link>
      ))}
      <a href="#sales" className={styles.salesLink}>
        The weekly sales
      </a>
    </p>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const param = (await searchParams)[zipParam];
  const zip = zipFor({
    param: typeof param === "string" ? param.trim() : undefined,
    cookie: (await cookies()).get(zipCookie)?.value,
    headers: await headers(),
  });
  const { edition, seasonal, chapters } = await loadLanding();
  const withCollections = new Set(chapters.map(({ source }) => source));

  return (
    <main className={fieldGuide.page}>
      <header className={styles.strip}>
        <span className={fieldGuide.captionFace}>Four kitchens, one search</span>
        <span className={fieldGuide.captionFace}>
          {edition}
        </span>
      </header>

      <div className={styles.titlePage}>
        <div>
          <h1 className={styles.title}>Forage</h1>
          <p className={styles.subtitle}>
            A field guide to recipes from four kitchens.
          </p>
          <div className={styles.search}>
            <SearchForm large label="Look up an ingredient, a dish or a cook" />
          </div>
          <p className={styles.season}>
            <span className={fieldGuide.note}>In season now:</span>
            {seasonal.map((item) => (
              // a prefetch would run a search against every source
              <Link key={item} prefetch={false} href={searchLink(item)}>
                {item}
              </Link>
            ))}
          </p>
          {zip ? (
            <Suspense
              fallback={
                <p className={styles.season}>
                  <span className={fieldGuide.note}>
                    On sale near {zip}: reading the weekly ads…
                  </span>
                </p>
              }
            >
              <OnSale zip={zip} />
            </Suspense>
          ) : (
            <div className={styles.zip}>
              <ZipForm label="What’s on sale near you" />
            </div>
          )}
        </div>

        <nav aria-labelledby="contents" className={styles.contents}>
          <h2 id="contents" className={styles.contentsTitle}>
            Contents
          </h2>
          <ol>
            {sources.map((source) => {
              const { numeral, name, domain } = sourceInfo[source];
              const hasChapter = withCollections.has(source);

              return (
                <li key={source}>
                  <span className={styles.contentsNumeral}>{numeral}.</span>
                  {hasChapter ? <a href={`#${source}`}>{name}</a> : <span>{name}</span>}
                  <span className={styles.leader} />
                  <span className={fieldGuide.note}>
                    {hasChapter ? domain : "search only"}
                  </span>
                </li>
              );
            })}
            {zip && (
              <li>
                <span className={styles.contentsNumeral}>{salesNumeral}.</span>
                <a href="#sales">On sale near {zip}</a>
                <span className={styles.leader} />
                <span className={fieldGuide.note}>weekly sales</span>
              </li>
            )}
          </ol>
          <p className={styles.colophon}>
            Every recipe stays on its own site. Forage searches all four at once
            and sends you there.
          </p>
        </nav>
      </div>

      {chapters.map(({ source, collections }) => (
        <section key={source} id={source} className={styles.chapter}>
          <ChapterHeading source={source} />
          {collections.map((collection) => (
            <div key={collection.title} className={styles.collection}>
              <div className={styles.collectionHead}>
                <h3 className={styles.collectionTitle}>{collection.title}</h3>
                <a
                  href={collection.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.collectionLink}
                >
                  The whole collection
                </a>
              </div>
              <Plates recipes={collection.recipes} />
            </div>
          ))}
        </section>
      ))}

      {zip && <SalesChapter zip={zip} numeral={salesNumeral} />}
    </main>
  );
}
