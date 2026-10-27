import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { stubFetch } from "@/testing";

import { GET as locate } from "./route";

const request = (path: string) => new NextRequest(new URL(path, "http://localhost"));

function census(geographies: Record<string, { ZCTA5?: string }[]>) {
  return stubFetch({
    "geocoding.geo.census.gov": JSON.stringify({ result: { geographies } }),
  });
}

describe("GET /sales/locate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads the zip code at the coordinates from the Census geocoder", async () => {
    const fetchMock = census({
      States: [{}],
      "2020 Census ZIP Code Tabulation Areas": [{ ZCTA5: "80202" }],
    });

    const res = await locate(request("/sales/locate?lat=39.7542&lon=-105.0014"));

    expect(await res.json()).toEqual({ zip: "80202" });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect([url.searchParams.get("x"), url.searchParams.get("y")]).toEqual([
      "-105.0014",
      "39.7542",
    ]);
  });

  it("has no zip code outside the US", async () => {
    census({});

    const res = await locate(request("/sales/locate?lat=48.85&lon=2.35"));

    expect(await res.json()).toEqual({ zip: null });
  });

  it("refuses missing or impossible coordinates", async () => {
    expect((await locate(request("/sales/locate?lat=39.7"))).status).toBe(400);
    expect((await locate(request("/sales/locate?lat=95&lon=0"))).status).toBe(400);
  });

  it("reports the geocoder failing, including an HTML error page sent as a success", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    stubFetch({ "geocoding.geo.census.gov": new Response("", { status: 503 }) });
    expect((await locate(request("/sales/locate?lat=39.7&lon=-105"))).status).toBe(502);

    stubFetch({ "geocoding.geo.census.gov": "<!DOCTYPE html><html>Service unavailable</html>" });
    expect((await locate(request("/sales/locate?lat=39.7&lon=-105"))).status).toBe(502);
  });
});
