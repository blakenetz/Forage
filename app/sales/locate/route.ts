import type { NextRequest } from "next/server";

import { requestHeaders } from "@/sources";

export type Located = { zip: string | null };

/** The parts of the Census geocoder's coordinates response that Forage reads */
type CensusGeographies = {
  result: { geographies: Record<string, { ZCTA5?: string }[]> };
};

/**
 * The zip code at the browser's coordinates, from the US Census geocoder
 * (free, keyless, but without CORS headers, hence this route). `zip` is
 * null outside the US.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "");
  // NaN fails both comparisons
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180))
    return Response.json({ error: "lat and lon must be coordinates" }, { status: 400 });

  const res = await fetch(
    `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${new URLSearchParams({
      x: String(lon),
      y: String(lat),
      benchmark: "Public_AR_Current",
      vintage: "Current_Current",
      // the zip code layer's name carries its census year; find it by suffix
      layers: "all",
      format: "json",
    })}`,
    { headers: requestHeaders }
  );
  if (!res.ok)
    return Response.json({ error: `Census geocoder returned ${res.status}` }, { status: 502 });

  const { result }: CensusGeographies = await res.json();
  const layer = Object.entries(result.geographies).find(([name]) =>
    name.endsWith("ZIP Code Tabulation Areas")
  )?.[1];

  return Response.json({ zip: layer?.[0]?.ZCTA5 ?? null } satisfies Located);
}
