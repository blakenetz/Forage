import React from "react";
import styles from "./search.module.css";

export default async function Layout({ children }: React.PropsWithChildren) {
  return <main className={styles.main}>{children}</main>;
}
