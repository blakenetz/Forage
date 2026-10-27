import { cache } from "react";

import { requestHeaders } from "@/sources";
import { storeInfo, stores, type Store } from "@/stores";
import type { FlippItem, WholeFoodsLocation, WholeFoodsPromotion } from "@/types";

import { saleIngredients, type SaleIngredient } from "./ingredients";

export type SaleItem = {
  name: string;
  /** what you pay: "$3.32/lb", "2 for $4", "Buy one, get one free" */
  price?: string;
  /** the regular or member price behind it */
  note?: string;
};

export type StoreSales = {
  /** the store's own sales page */
  url: string;
  /** the store the prices are for, when the source names one */
  location?: string;
  /** the last day of the sale, YYYY-MM-DD */
  through?: string;
  items: SaleItem[];
};

export type SalesResult =
  | { status: "found"; sales: StoreSales }
  /** the store has no location (or weekly ad) near this zip code */
  | { status: "none" }
  /** the source errored or blocked us */
  | { status: "failed" };

/** Weekly ads change once a week, with the odd mid-week deal; refetch hourly */
const revalidate = 3600;

/** The latest of the items' last days, compared as YYYY-MM-DD */
function lastDay(dates: string[]): string | undefined {
  return dates.map((date) => date.slice(0, 10)).sort().at(-1);
}

/** Drops repeats: weekly ads often print the same deal on two pages */
function unique(items: SaleItem[]): SaleItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.name}|${item.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const dollars = (amount: number) =>
  `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

/** Ad copy is shouted ("BUY ONE, GET ONE 50% OFF"); footnote marks are noise */
const quiet = (text: string) =>
  text.replace(/\*+/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/** "BUY ONE, GET ONE FREE of equal or lesser value" → "Buy one, get one free" */
function saleStory(story: string): string {
  const text = quiet(story)
    .replace(/ (regular retail )?of equal or lesser value/, "")
    .replace(/ regular retail$/, "");

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Flipp splits a price into "2 FOR" · 4 · "/EA With Card"; this joins it back */
export function flippSaleItem(item: FlippItem): SaleItem {
  const notes: string[] = [];
  let price: string | undefined;

  if (item.current_price !== null) {
    const pre = item.pre_price_text ? quiet(item.pre_price_text) : "";
    price = dollars(item.current_price);
    // "2 FOR" reads "2 for $4"; "2/" reads "2/$10"
    if (pre) price = pre.endsWith("/") ? `${pre}${price}` : `${pre} ${price}`;
    if (item.post_price_text) {
      const post = quiet(item.post_price_text).replace(/\.$/, "");
      price += post.startsWith("/") ? post : ` ${post}`;
    }
    if (item.sale_story) notes.push(saleStory(item.sale_story));
  } else if (item.sale_story) {
    price = saleStory(item.sale_story);
  }

  if (item.original_price !== null) notes.push(`was ${dollars(item.original_price)}`);

  return {
    name: item.name.trim(),
    price,
    note: notes.length ? notes.join(" · ") : undefined,
  };
}

const flippMerchants: Record<Exclude<Store, "wholeFoods">, string> = {
  kingSoopers: "King Soopers",
  sprouts: "Sprouts Farmers Market",
};

/**
 * Flipp reads the weekly ads of the stores around a zip code. Searching for
 * the merchant's name returns every item in its current ads there.
 */
async function flippSales(
  store: keyof typeof flippMerchants,
  zip: string
): Promise<SalesResult> {
  const merchant = flippMerchants[store];
  const res = await fetch(
    `https://backflipp.wishabi.com/flipp/items/search?${new URLSearchParams({
      locale: "en-us",
      postal_code: zip,
      q: merchant,
    })}`,
    { headers: requestHeaders, next: { revalidate } }
  );
  if (!res.ok) throw new Error(`Flipp returned ${res.status} for ${merchant}`);

  const { items }: { items: FlippItem[] } = await res.json();
  // the ads also sell candy bowls and light bulbs; keep the groceries
  const groceries = items.filter(
    (item) =>
      item.merchant_name === merchant && item._L1 === "Food, Beverages & Tobacco"
  );
  if (!groceries.length) return { status: "none" };

  return {
    status: "found",
    sales: {
      url: storeInfo[store].flyerUrl,
      // ads end at midnight local time, which Flipp gives in UTC (early the
      // next morning); half a day back lands on the last day in any US zone
      through: lastDay(
        groceries.map((item) =>
          new Date(Date.parse(item.valid_to) - 12 * 60 * 60 * 1000).toISOString()
        )
      ),
      items: unique(groceries.map(flippSaleItem)),
    },
  };
}

/** "Prime: 30% off" is only worth showing when it is a price, not a footnote */
export function wholeFoodsSaleItem(promotion: WholeFoodsPromotion): SaleItem {
  const name = `${promotion.originBrandName.trim()} ${promotion.productName.trim()}`
    .replace(/\s+/g, " ")
    .trim();
  const sale = promotion.salePrice.trim();
  const prime = promotion.primePrice.trim();
  const primeIsPrice = prime && !prime.startsWith("*");
  const regular = promotion.regularPrice.trim();

  const notes = [
    sale && primeIsPrice && `${prime} with Prime`,
    regular && (regular.startsWith("$") ? `regular ${regular}` : regular.toLowerCase()),
  ].filter(Boolean);

  return {
    name,
    price: sale || (primeIsPrice ? `${prime} with Prime` : undefined),
    note: notes.length ? notes.join(" · ") : undefined,
  };
}

const wholeFoods = {
  /** the store finder's id for the Whole Foods Market brand */
  brand: "VUZHIFdob2xlIEZvb2Rz",
  locations:
    /<script type="a-state" data-a-state="\{&quot;key&quot;:&quot;list-page-state&quot;\}">([\s\S]*?)<\/script>/,
  nextData: /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
};

/** The store finder page embeds its stores, nearest first, in an `a-state` script */
async function nearestWholeFoods(zip: string): Promise<WholeFoodsLocation | undefined> {
  const res = await fetch(
    `https://www.wholefoodsmarket.com/aplf/list?${new URLSearchParams({
      almBrandId: wholeFoods.brand,
      context: "wholefoods",
      postalCode: zip,
    })}`,
    // stores open and close rarely
    { headers: requestHeaders, next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error(`Whole Foods store finder returned ${res.status}`);

  const state = (await res.text()).match(wholeFoods.locations)?.[1];
  if (!state) throw new Error("Whole Foods store finder has no store list");

  const { locations }: { locations: WholeFoodsLocation[] } = JSON.parse(state);
  return locations[0];
}

/** The sales flyer page server-renders the store's promotions into `__NEXT_DATA__` */
async function wholeFoodsSales(zip: string): Promise<SalesResult> {
  const location = await nearestWholeFoods(zip);
  if (!location) return { status: "none" };

  const url = `${storeInfo.wholeFoods.flyerUrl}?store-id=${location.storeCode}`;
  const res = await fetch(url, { headers: requestHeaders, next: { revalidate } });
  if (!res.ok) throw new Error(`Whole Foods sales flyer returned ${res.status}`);

  const json = (await res.text()).match(wholeFoods.nextData)?.[1];
  if (!json) throw new Error("Whole Foods sales flyer has no __NEXT_DATA__");

  const promotions: WholeFoodsPromotion[] =
    JSON.parse(json).props.pageProps.promotions ?? [];

  return {
    status: "found",
    sales: {
      url,
      location: [location.locationName, location.address.addressLines[0]]
        .filter(Boolean)
        .join(", "),
      // endDate is the last day itself, at midnight Central
      through: lastDay(promotions.map((promotion) => promotion.endDate)),
      items: unique(promotions.map(wholeFoodsSaleItem)),
    },
  };
}

/**
 * Memoised per request, so the page's sections share a single fetch per
 * store. A store that errors is reported as failed rather than breaking the page.
 */
export const getStoreSales = cache(
  async (store: Store, zip: string): Promise<SalesResult> => {
    try {
      return store === "wholeFoods"
        ? await wholeFoodsSales(zip)
        : await flippSales(store, zip);
    } catch (error) {
      console.log(error);

      return { status: "failed" };
    }
  }
);

/** The ingredients on sale at the stores near `zip` that answered, best first */
export async function ingredientsOnSale(zip: string): Promise<SaleIngredient[]> {
  const results = await Promise.all(
    stores.map((store) => getStoreSales(store, zip))
  );

  return saleIngredients(
    stores.flatMap((store, i) => {
      const result = results[i];
      return result.status === "found" ? { store, items: result.sales.items } : [];
    })
  );
}
