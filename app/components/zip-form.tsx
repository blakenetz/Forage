import Form from "next/form";

import { zipParam } from "@/stores";

import LocateButton from "./locate-button";
import SearchButton from "./search-button";
import styles from "./field-guide.module.css";

/** A GET form to the landing page's sales, like the recipe search form, or the browser's location */
export default function ZipForm({ zip, label }: { zip?: string; label?: string }) {
  return (
    <Form action="/" className={`${styles.search} ${styles.zipForm}`}>
      {label && (
        <label htmlFor="sales-zip" className={styles.searchLabel}>
          {label}
        </label>
      )}
      <div className={styles.searchField}>
        <input
          id="sales-zip"
          name={zipParam}
          defaultValue={zip}
          aria-label={label ? undefined : "Zip code"}
          placeholder="Zip code"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          autoComplete="postal-code"
          required
        />
        <SearchButton label="See the sales" pendingLabel="Looking…" />
      </div>
      <LocateButton />
    </Form>
  );
}
