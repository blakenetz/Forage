import Link from "next/link";
import { Title } from "@mantine/core";
import { IconToolsKitchen2 } from "@tabler/icons-react";
import React from "react";
import styles from "../search.module.css";
import SearchControl from "./searchControl";

interface HeaderProps {
  loading?: boolean;
}

export default function Header({ loading }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Title className={styles.title} lineClamp={1} component="h1">
        <Link href="/" className={styles.titleLink}>
          <IconToolsKitchen2 /> Foraging
        </Link>
      </Title>
      {!loading && <SearchControl />}
    </header>
  );
}
