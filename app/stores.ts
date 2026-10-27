export const stores = ["wholeFoods", "kingSoopers", "sprouts"] as const;
export type Store = (typeof stores)[number];

export const storeInfo: Record<
  Store,
  { name: string; domain: string; numeral: string; flyerUrl: string }
> = {
  wholeFoods: {
    name: "Whole Foods Market",
    domain: "wholefoodsmarket.com",
    numeral: "I",
    flyerUrl: "https://www.wholefoodsmarket.com/sales-flyer",
  },
  kingSoopers: {
    name: "King Soopers",
    domain: "kingsoopers.com",
    numeral: "II",
    flyerUrl: "https://www.kingsoopers.com/weeklyad",
  },
  sprouts: {
    name: "Sprouts Farmers Market",
    domain: "sprouts.com",
    numeral: "III",
    flyerUrl: "https://www.sprouts.com/weekly-ad/",
  },
};

export const zipParam = "zip";
/** The last zip code asked for, which the landing page goes back to */
export const zipCookie = "forage-zip";

export function isZip(value: unknown): value is string {
  return typeof value === "string" && /^\d{5}$/.test(value);
}

/**
 * The zip code Vercel attaches to each request from the visitor's IP address.
 * It is only accurate to the city, so it is a starting point until the
 * visitor types a zip code or shares their location. Absent outside Vercel.
 */
function ipZip(headers: Headers): string | undefined {
  const zip = headers.get("x-vercel-ip-postal-code");
  return headers.get("x-vercel-ip-country") === "US" && isZip(zip) ? zip : undefined;
}

/** The zip code a visit is for: the one asked for, else the remembered one, else the IP's */
export function zipFor(visit: {
  param: unknown;
  cookie: string | undefined;
  headers: Headers;
}): string | undefined {
  if (isZip(visit.param)) return visit.param;
  if (isZip(visit.cookie)) return visit.cookie;
  return ipZip(visit.headers);
}

/** Where "Use my location" found the visitor, kept with the zip code it gave */
export const nearCookie = "forage-near";

/** "80204@39.724,-105.045": about 100 m of precision is plenty to rank stores */
export function nearValue(zip: string, latitude: number, longitude: number): string {
  return `${zip}@${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

/**
 * The saved coordinates, "39.724,-105.045", if they were saved for this zip
 * code; after the visitor types another zip code they no longer apply.
 */
export function nearFor(cookie: string | undefined, zip: string): string | undefined {
  const match = cookie?.match(/^(\d{5})@(-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)$/);
  return match?.[1] === zip ? match[2] : undefined;
}

/** The Whole Foods store picked from the store menu, by its store id */
export const storeParam = "store";
export const wholeFoodsCookie = "forage-whole-foods";

export function isStoreId(value: unknown): value is string {
  return typeof value === "string" && /^\d{5}$/.test(value);
}
