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
  /** the share off the regular price, 0.5 for half off, when the ad says enough to tell */
  discount?: number;
};

export type StoreSales = {
  /** the store's own sales page */
  url: string;
  /** the store the prices are for, when the source names one */
  location?: string;
  /** whose prices the list leads with, when not everyone's: "Prime prices" */
  pricing?: string;
  /** the last day of the sale, YYYY-MM-DD */
  through?: string;
  items: SaleItem[];
  /** the nearby stores to choose from instead, nearest first (Whole Foods) */
  choices?: { id: string; name: string; miles: number }[];
  /** which of `choices` the prices are for */
  chosen?: string;
};

/** Where the sales are for: a zip code and, for Whole Foods, where in it and which store */
export type Locale = {
  zip: string;
  /** "39.724,-105.045", from "Use my location" */
  near?: string;
  /** a Whole Foods store id picked from the store menu */
  wholeFoodsStore?: string;
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

const counts: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

/**
 * The share off that a deal's wording promises: "Buy one, get one free" and
 * "Buy 3, get 3 free" are half off, "Buy one, get one 50% off" a quarter,
 * "25% off" and "Save 25%" a quarter.
 */
export function dealDiscount(deal: string): number | undefined {
  const text = deal.toLowerCase();

  const multiBuy = text.match(/\bbuy (\w+),? get (\w+)\b(.*)/);
  if (multiBuy) {
    const buy = Number(multiBuy[1]) || counts[multiBuy[1]];
    const get = Number(multiBuy[2]) || counts[multiBuy[2]];
    const percent = multiBuy[3].match(/(\d+)% off/)?.[1];
    const off = percent ? Number(percent) / 100 : /\bfree\b/.test(multiBuy[3]) ? 1 : 0;
    if (buy && get && off) return (get * off) / (buy + get);
  }

  const percent = text.match(/(\d+)% off|\bsave (\d+)%/);
  if (percent) return Number(percent[1] ?? percent[2]) / 100;

  return undefined;
}

/** 1 − what you pay ÷ what it usually costs, when that is a real discount */
function shareOff(pay: number, usual: number): number | undefined {
  const share = 1 - pay / usual;
  return share > 0 && share < 1 ? share : undefined;
}

/**
 * Biggest discount first; deals whose discount the ad doesn't say keep their
 * place in the ad, after the rest. (`sort` is stable.)
 */
function byDiscount(items: SaleItem[]): SaleItem[] {
  return items.toSorted((a, b) => (b.discount ?? -1) - (a.discount ?? -1));
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

  // "2 FOR" $4 against a regular price for one
  const quantity = Number(item.pre_price_text?.match(/^\s*(\d+)\s*(?:for|\/)/i)?.[1] ?? 1);
  const discount =
    (item.sale_story ? dealDiscount(item.sale_story) : undefined) ??
    (item.current_price !== null && item.original_price
      ? shareOff(item.current_price / quantity, item.original_price)
      : undefined);

  return {
    name: item.name.trim(),
    price,
    note: notes.length ? notes.join(" · ") : undefined,
    discount,
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
      items: byDiscount(unique(groceries.map(flippSaleItem))),
    },
  };
}

/**
 * Prime members' price first, with what everyone else pays beneath it. The
 * Prime column sometimes holds a footnote ("*Excluded from the extra 10%
 * off") instead of a price; then the sale price is everyone's.
 */
export function wholeFoodsSaleItem(promotion: WholeFoodsPromotion): SaleItem {
  const name = `${promotion.originBrandName.trim()} ${promotion.productName.trim()}`
    .replace(/\s+/g, " ")
    .trim();
  const sale = promotion.salePrice.trim();
  const prime = promotion.primePrice.trim();
  const primeIsPrice = prime && !prime.startsWith("*");
  const regular = promotion.regularPrice.trim();

  const notes = [
    primeIsPrice && (sale ? `${sale} without Prime` : "Prime members only"),
    regular && (regular.startsWith("$") ? `regular ${regular}` : regular.toLowerCase()),
  ].filter(Boolean);

  const price = (primeIsPrice ? prime : sale) || undefined;

  return {
    name,
    price,
    note: notes.length ? notes.join(" · ") : undefined,
    discount: price ? (dealDiscount(price) ?? wholeFoodsShareOff(price, regular)) : undefined,
  };
}

/**
 * "$2.54/lb" or "2 for $5" against a single regular price ("$2.99/lb");
 * a regular range ("$1.49 to $7.49") or "Regular prices vary" tells nothing.
 */
function wholeFoodsShareOff(price: string, regular: string): number | undefined {
  const usual = regular.match(/^\$(\d+(?:\.\d+)?)(?:\/\w+| ea)?$/)?.[1];
  if (!usual) return undefined;

  const amountOff = price.match(/^\$(\d+(?:\.\d+)?) off/)?.[1];
  if (amountOff) return shareOff(Number(usual) - Number(amountOff), Number(usual));

  const pay = price.match(/^(?:(\d+) for )?\$(\d+(?:\.\d+)?)/);
  return pay ? shareOff(Number(pay[2]) / Number(pay[1] ?? 1), Number(usual)) : undefined;
}

const wholeFoods = {
  /** the store finder's id for the Whole Foods Market brand */
  brand: "VUZHIFdob2xlIEZvb2Rz",
  locations:
    /<script type="a-state" data-a-state="\{&quot;key&quot;:&quot;list-page-state&quot;\}">([\s\S]*?)<\/script>/,
  nextData: /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
};

/** Miles between two points, as the crow flies */
function miles(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const radians = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * radians) / 2) ** 2 +
    Math.cos(lat1 * radians) *
      Math.cos(lat2 * radians) *
      Math.sin(((lon2 - lon1) * radians) / 2) ** 2;

  return 2 * 3958.8 * Math.asin(Math.sqrt(a));
}

/**
 * The store finder page embeds the stores around a zip code in an `a-state`
 * script, nearest to the middle of the zip code first.
 */
async function wholeFoodsAround(zip: string): Promise<WholeFoodsLocation[]> {
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
  return locations;
}

/**
 * The store whose flyer to read: the one picked from the menu if it is
 * around this zip code, else the nearest to the visitor's location when
 * known, else the nearest to the middle of the zip code. A zip code covers
 * miles, so its middle can be closer to another store than the visitor is.
 */
async function wholeFoodsSales({ zip, near, wholeFoodsStore }: Locale): Promise<SalesResult> {
  const around = await wholeFoodsAround(zip);
  if (!around.length) return { status: "none" };

  // "39.724,-105.045", already checked by `nearFor`
  const [latitude, longitude] = near?.split(",").map(Number) ?? [];
  const ranked = around
    .map((location) => ({
      location,
      miles: near
        ? miles([latitude, longitude], [location.geocode.latitude, location.geocode.longitude])
        : location.distance,
    }))
    .sort((a, b) => a.miles - b.miles);
  const { location } =
    ranked.find(({ location }) => location.storeCode === wholeFoodsStore) ?? ranked[0];

  const url = `${storeInfo.wholeFoods.flyerUrl}?store-id=${location.storeCode}`;
  const res = await fetch(url, { headers: requestHeaders, next: { revalidate } });
  if (!res.ok) throw new Error(`Whole Foods sales flyer returned ${res.status}`);

  const json = (await res.text()).match(wholeFoods.nextData)?.[1];
  if (!json) throw new Error("Whole Foods sales flyer has no __NEXT_DATA__");

  const promotions: WholeFoodsPromotion[] =
    JSON.parse(json).props.pageProps.promotions ?? [];
  const place = ({ locationName, address }: WholeFoodsLocation) =>
    [locationName, address.addressLines[0]].filter(Boolean).join(", ");

  return {
    status: "found",
    sales: {
      url,
      location: place(location),
      pricing: "Prime prices",
      // endDate is the last day itself, at midnight Central
      through: lastDay(promotions.map((promotion) => promotion.endDate)),
      items: byDiscount(unique(promotions.map(wholeFoodsSaleItem))),
      choices: ranked.map(({ location, miles }) => ({
        id: location.storeCode,
        name: place(location),
        miles,
      })),
      chosen: location.storeCode,
    },
  };
}

/**
 * Memoised per request, so the page's sections share a single fetch per
 * store. `cache` matches arguments by identity, hence the locale's parts
 * as separate strings. A store that errors is reported as failed rather
 * than breaking the page.
 */
const storeSales = cache(
  async (
    store: Store,
    zip: string,
    near?: string,
    wholeFoodsStore?: string
  ): Promise<SalesResult> => {
    try {
      return store === "wholeFoods"
        ? await wholeFoodsSales({ zip, near, wholeFoodsStore })
        : await flippSales(store, zip);
    } catch (error) {
      console.log(error);

      return { status: "failed" };
    }
  }
);

export function getStoreSales(
  store: Store,
  { zip, near, wholeFoodsStore }: Locale
): Promise<SalesResult> {
  return storeSales(store, zip, near, wholeFoodsStore);
}

/** The ingredients on sale at the stores around the locale that answered, best first */
export async function ingredientsOnSale(locale: Locale): Promise<SaleIngredient[]> {
  const results = await Promise.all(
    stores.map((store) => getStoreSales(store, locale))
  );

  return saleIngredients(
    stores.flatMap((store, i) => {
      const result = results[i];
      return result.status === "found" ? { store, items: result.sales.items } : [];
    })
  );
}
