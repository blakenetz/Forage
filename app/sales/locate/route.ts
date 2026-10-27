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

  let geographies: CensusGeographies["result"]["geographies"];
  try {
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
      // the geocoder sometimes hangs; the visitor can still type a zip code
      { headers: requestHeaders, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`Census geocoder returned ${res.status}`);

    // when overloaded it answers 200 with an HTML error page, which fails here
    ({ geographies } = ((await res.json()) as CensusGeographies).result);
  } catch (error) {
    console.log(error);

    return Response.json({ error: "the Census geocoder didn’t answer" }, { status: 502 });
  }

  const layer = Object.entries(geographies).find(([name]) =>
    name.endsWith("ZIP Code Tabulation Areas")
  )?.[1];

  return Response.json({ zip: layer?.[0]?.ZCTA5 ?? null } satisfies Located);
}
