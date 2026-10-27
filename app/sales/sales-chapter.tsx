import Link from "next/link";
import { Suspense } from "react";

import fieldGuide from "@/components/field-guide.module.css";
import ZipForm from "@/components/zip-form";
import { searchParam } from "@/sources";
import { storeInfo, stores, type Store } from "@/stores";

import { getStoreSales, ingredientsOnSale, type SaleItem } from "./data";
import styles from "./sales.module.css";

/** The first store's list shows this many before "All 44 on sale" */
const visiblePrices = 12;
const counted = ["no", "one", "two", "three"];

/** "2026-10-27" → "Tue, Oct 27" */
const saleDay = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const and = new Intl.ListFormat("en", { type: "conjunction" });
const or = new Intl.ListFormat("en", { type: "disjunction" });

async function Summary({ zip }: { zip: string }) {
  const results = await Promise.all(
    stores.map((store) => getStoreSales(store, zip))
  );
  const named = (status: string) =>
    stores
      .filter((_, i) => results[i].status === status)
      .map((store) => storeInfo[store].name);
  const answered = results.flatMap((result) =>
    result.status === "found" ? result.sales : []
  );
  const total = answered.reduce((sum, { items }) => sum + items.length, 0);
  const missing = named("none");
  const failed = named("failed");

  return (
    <p className={styles.summary}>
      {answered.length
        ? `${total.toLocaleString("en-US")} groceries on sale at ${counted[answered.length]} ${answered.length === 1 ? "store" : "stores"}.`
        : "No weekly sales to show."}
      {missing.length > 0 && ` No ${or.format(missing)} near ${zip}.`}
      {failed.length > 0 && ` ${and.format(failed)} didn’t answer this time.`}
    </p>
  );
}

/** Every ingredient on sale, as searches of all four kitchens */
async function SaleSearches({ zip }: { zip: string }) {
  const ingredients = await ingredientsOnSale(zip);
  if (!ingredients.length) return null;

  return (
    <p className={styles.searches}>
      <span className={fieldGuide.note}>Search the kitchens for what’s on sale:</span>
      {ingredients.map(({ term }) => (
        <Link
          key={term}
          // a prefetch would run a search against every source
          prefetch={false}
          href={`/search?${new URLSearchParams({ [searchParam]: term })}`}
        >
          {term}
        </Link>
      ))}
    </p>
  );
}

function PriceList({ items }: { items: SaleItem[] }) {
  return (
    <ul className={styles.prices}>
      {items.map((item, i) => (
        <li key={`${i}-${item.name}`} className={styles.price}>
          <span>{item.name}</span>
          {item.price && (
            <>
              <span className={styles.leader} />
              <span className={styles.priceAmount}>{item.price}</span>
            </>
          )}
          {item.note && <span className={styles.priceNote}>{item.note}</span>}
        </li>
      ))}
    </ul>
  );
}

function StoreName({ store }: { store: Store }) {
  return <h3 className={styles.storeName}>{storeInfo[store].name}</h3>;
}

/**
 * The first store's prices are laid open; the others wait in a closed
 * `<details>`, which opens in place without client JavaScript.
 */
async function StoreSales({
  store,
  zip,
  open,
}: {
  store: Store;
  zip: string;
  open: boolean;
}) {
  const result = await getStoreSales(store, zip);
  const { name, domain } = storeInfo[store];

  if (result.status !== "found")
    return (
      <div className={styles.store}>
        <StoreName store={store} />
        <p className={styles.empty}>
          {result.status === "failed"
            ? `Nothing came back from ${domain}. The site didn’t answer.`
            : `No ${name} near ${zip}.`}
        </p>
      </div>
    );

  const { url, location, through, items } = result.sales;
  const until = through ? `through ${saleDay(through)}` : undefined;
  const where = location ? `Prices at ${location}` : `The weekly ad around ${zip}`;
  // a closed store shows its end date in the summary instead
  const source = (
    <p className={styles.storeNote}>
      {open && until ? `${where}, ${until}` : where}.{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.flyerLink}
      >
        The whole ad
      </a>
    </p>
  );

  if (!open)
    return (
      <details className={styles.store}>
        <summary className={styles.storeSummary}>
          <StoreName store={store} />
          <span className={fieldGuide.note}>
            {[`${items.length} on sale`, until].filter(Boolean).join(", ")}
          </span>
        </summary>
        {source}
        <PriceList items={items} />
      </details>
    );

  const rest = items.slice(visiblePrices);

  return (
    <div className={styles.store}>
      <StoreName store={store} />
      {source}
      <PriceList items={items.slice(0, visiblePrices)} />
      {rest.length > 0 && (
        <details className={fieldGuide.more}>
          <summary>
            <span className={fieldGuide.moreClosed}>
              All {items.length} on sale at {name}
            </span>
            <span className={fieldGuide.moreOpen}>Show fewer</span>
          </summary>
          <PriceList items={rest} />
        </details>
      )}
    </div>
  );
}

/** The landing page's last chapter: this week's sales at the stores near `zip` */
export default function SalesChapter({ zip, numeral }: { zip: string; numeral: string }) {
  return (
    <section id="sales" className={styles.chapter}>
      <div className={fieldGuide.chapter}>
        <span className={fieldGuide.numeral}>{numeral}.</span>
        <h2 className={fieldGuide.chapterTitle}>On sale near {zip}</h2>
      </div>

      <div className={styles.head}>
        <Suspense fallback={<p className={styles.summary}>Reading three weekly ads…</p>}>
          <Summary zip={zip} />
        </Suspense>
        <ZipForm zip={zip} />
      </div>

      <Suspense>
        <SaleSearches zip={zip} />
      </Suspense>

      {stores.map((store, i) => (
        <Suspense
          key={store}
          fallback={
            <div className={styles.store}>
              <StoreName store={store} />
              <p className={styles.empty}>Reading the weekly ad…</p>
            </div>
          }
        >
          <StoreSales store={store} zip={zip} open={i === 0} />
        </Suspense>
      ))}
    </section>
  );
}
