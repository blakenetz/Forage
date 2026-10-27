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
