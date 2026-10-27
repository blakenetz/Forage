import { NextResponse, type NextRequest } from "next/server";

import { isZip, zipCookie, zipParam } from "@/stores";

/** Remembers a zip code asked for on the landing page, which goes back to it next visit */
export function proxy(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get(zipParam)?.trim();
  const response = NextResponse.next();

  if (isZip(zip))
    response.cookies.set(zipCookie, zip, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

  return response;
}

export const config = {
  // `zipParam`; matchers must be literals
  matcher: [{ source: "/", has: [{ type: "query", key: "zip" }] }],
};
