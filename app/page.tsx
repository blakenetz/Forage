import Link from "next/link";

import ChapterHeading from "@/components/chapter-heading";
import fieldGuide from "@/components/field-guide.module.css";
import { Plates } from "@/components/plates";
import SearchForm from "@/components/search-form";
import { getCollections } from "@/collections";
import { inSeason } from "@/seasons";
import { searchParam, sourceInfo, sources } from "@/sources";

import styles from "./page.module.css";

/** Prerendered, then rebuilt at most hourly as the sources' collections change */
export const revalidate = 3600;

/** Everything the landing page shows that depends on the source sites or today's date */
async function loadLanding() {
  const now = new Date();
  const chapters = await Promise.all(
    sources.map(async (source) => ({
      source,
      collections: await getCollections(source),
    }))
  );

  return {
    edition: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
    seasonal: inSeason[now.getMonth()],
    chapters: chapters.filter(({ collections }) => collections.length),
  };
}

export default async function Home() {
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
              <Link
                key={item}
                // a prefetch would run a search against every source
                prefetch={false}
                href={`/search?${new URLSearchParams({ [searchParam]: item })}`}
              >
                {item}
              </Link>
            ))}
          </p>
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
    </main>
  );
}
