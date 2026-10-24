import Form from "next/form";

import { searchParam } from "@/sources";

import SearchButton from "./search-button";
import styles from "./field-guide.module.css";

/**
 * A GET form to /search: works without JavaScript, and with it Next.js
 * prefetches the results route and navigates client-side.
 */
export default function SearchForm({
  query,
  label,
  large,
}: {
  query?: string;
  /** a visible label; without one the field is labelled for screen readers */
  label?: string;
  large?: boolean;
}) {
  return (
    <Form
      action="/search"
      className={`${styles.search} ${large ? styles.searchLarge : ""}`}
    >
      {label && (
        <label htmlFor="search-query" className={styles.searchLabel}>
          {label}
        </label>
      )}
      <div className={styles.searchField}>
        <input
          id="search-query"
          name={searchParam}
          type="search"
          defaultValue={query}
          aria-label={label ? undefined : "Search recipes"}
          autoComplete="off"
          required
        />
        <SearchButton />
      </div>
    </Form>
  );
}
