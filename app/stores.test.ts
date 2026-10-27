import { describe, expect, it } from "vitest";

import { zipFor } from "./stores";

const denver = new Headers({
  "x-vercel-ip-country": "US",
  "x-vercel-ip-postal-code": "80202",
});

describe("zipFor", () => {
  it("prefers the zip code asked for, then the remembered one, then the IP's", () => {
    expect(zipFor({ param: "94301", cookie: "80301", headers: denver })).toBe("94301");
    expect(zipFor({ param: undefined, cookie: "80301", headers: denver })).toBe("80301");
    expect(zipFor({ param: undefined, cookie: undefined, headers: denver })).toBe("80202");
  });

  it("skips a zip code that isn't five digits", () => {
    expect(zipFor({ param: "8020", cookie: "abcde", headers: denver })).toBe("80202");
  });

  it("has no zip code for a visitor outside the US or off Vercel", () => {
    const toronto = new Headers({
      "x-vercel-ip-country": "CA",
      "x-vercel-ip-postal-code": "M5V",
    });

    expect(zipFor({ param: undefined, cookie: undefined, headers: toronto })).toBeUndefined();
    expect(zipFor({ param: undefined, cookie: undefined, headers: new Headers() })).toBeUndefined();
  });
});
