export const sources = [
  "newYorkTimesCooking",
  "seriousEats",
  "ottolenghi",
  "mollyBaz",
] as const;
export type Source = (typeof sources)[number];

export type SourceSymbol = "disc" | "square" | "triangle" | "ring";

export const sourceInfo: Record<
  Source,
  { name: string; domain: string; symbol: SourceSymbol; numeral: string }
> = {
  newYorkTimesCooking: {
    name: "New York Times Cooking",
    domain: "cooking.nytimes.com",
    symbol: "disc",
    numeral: "I",
  },
  seriousEats: {
    name: "Serious Eats",
    domain: "seriouseats.com",
    symbol: "square",
    numeral: "II",
  },
  ottolenghi: {
    name: "Ottolenghi",
    domain: "ottolenghi.co.uk",
    symbol: "triangle",
    numeral: "III",
  },
  mollyBaz: {
    name: "Molly Baz",
    domain: "mollybaz.com",
    symbol: "ring",
    numeral: "IV",
  },
};

export const searchParam = "q";

/**
 * Sent with every request to a source. Serious Eats refuses Node's default
 * user agent but answers a client that says who it is.
 */
export const requestHeaders = {
  "user-agent": "Forage/1.0 (+https://forage-drab.vercel.app)",
};
