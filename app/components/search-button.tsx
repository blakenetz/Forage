"use client";

import { useFormStatus } from "react-dom";

import styles from "./field-guide.module.css";

/** Instant feedback while the results page shell is on its way */
export default function SearchButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.searchButton} disabled={pending}>
      {pending ? "Searching…" : "Search"}
    </button>
  );
}
