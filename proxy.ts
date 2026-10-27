import { NextResponse, type NextRequest } from "next/server";

import {
  isStoreId,
  isZip,
  storeParam,
  wholeFoodsCookie,
  zipCookie,
  zipParam,
} from "@/stores";

const remember = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

/**
 * Remembers a zip code, or a Whole Foods store picked from the menu, asked
 * for on the landing page, which goes back to them next visit.
 */
export function proxy(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const zip = searchParams.get(zipParam)?.trim();
  const store = searchParams.get(storeParam);
  const response = NextResponse.next();

  if (isZip(zip)) response.cookies.set(zipCookie, zip, remember);
  if (isStoreId(store)) response.cookies.set(wholeFoodsCookie, store, remember);

  return response;
}

export const config = {
  // `zipParam` and `storeParam`; matchers must be literals
  matcher: [
    { source: "/", has: [{ type: "query", key: "zip" }] },
    { source: "/", has: [{ type: "query", key: "store" }] },
  ],
};
