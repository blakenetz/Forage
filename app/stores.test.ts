import { describe, expect, it } from "vitest";

import { nearFor, nearValue, zipFor } from "./stores";

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

describe("nearFor", () => {
  it("applies saved coordinates only to the zip code they were saved with", () => {
    const saved = nearValue("80204", 39.72425004524048, -105.04536866039788);

    expect(saved).toBe("80204@39.724,-105.045");
    expect(nearFor(saved, "80204")).toBe("39.724,-105.045");
    expect(nearFor(saved, "80202")).toBeUndefined();
  });

  it("ignores a cookie that isn't zip and coordinates", () => {
    expect(nearFor("80204@somewhere", "80204")).toBeUndefined();
    expect(nearFor(undefined, "80204")).toBeUndefined();
  });
});
