"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Located } from "@/sales/locate/route";
import { nearCookie, nearValue, zipParam } from "@/stores";

import styles from "./field-guide.module.css";

/**
 * Asks the browser where the visitor is, only once they click, and opens
 * the sales for that zip code. The coordinates are kept too, so the nearest
 * Whole Foods is the nearest to the visitor rather than to the zip code's middle.
 */
export default function LocateButton() {
  const router = useRouter();
  const [locating, setLocating] = useState(false);
  // pending until the sales for the new zip code have rendered
  const [navigating, startNavigation] = useTransition();
  const busy = locating || navigating;
  const [problem, setProblem] = useState<string>();

  function fail(message: string) {
    setLocating(false);
    setProblem(message);
  }

  function locate() {
    if (!("geolocation" in navigator))
      return fail("This browser can’t share its location.");

    setLocating(true);
    setProblem(undefined);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `/sales/locate?${new URLSearchParams({
              lat: String(coords.latitude),
              lon: String(coords.longitude),
            })}`
          );
          if (!res.ok) return fail("Couldn’t find your zip code. Type it in.");

          const { zip }: Located = await res.json();
          if (!zip) return fail("That’s outside the US. Type a zip code.");

          // saved here, not in the URL, so a shared link doesn't carry it
          document.cookie = `${nearCookie}=${nearValue(zip, coords.latitude, coords.longitude)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
          setLocating(false);
          startNavigation(() =>
            // stay where the form is: the sales chapter or under the search box
            router.push(`/?${new URLSearchParams({ [zipParam]: zip })}`, { scroll: false })
          );
        } catch {
          fail("Couldn’t find your zip code. Type it in.");
        }
      },
      (error) =>
        fail(
          error.code === error.PERMISSION_DENIED
            ? "Location is blocked for this site. Type a zip code."
            : "Couldn’t find your location. Type a zip code."
        ),
      // ranking stores miles apart doesn't need GPS precision
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 15_000 }
    );
  }

  return (
    <p className={styles.locate}>
      <button type="button" onClick={locate} disabled={busy}>
        {busy ? "Finding you…" : "Use my location"}
      </button>
      {problem && <span className={styles.locateProblem}>{problem}</span>}
    </p>
  );
}
