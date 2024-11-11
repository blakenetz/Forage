import Link from "next/link";
import { Text, Title } from "@mantine/core";
import { IconToolsKitchen2 } from "@tabler/icons-react";
import { startCase } from "lodash";
import React from "react";
import styles from "../search.module.css";
import { Source } from "../data";
import SearchControl from "./searchControl";

export default function Header({ selected }: { selected?: Source }) {
  const selectedText = selected ? (
    <span>
      :{" "}
      <Text component="span" c="dimmed">
        {startCase(selected)}
      </Text>
    </span>
  ) : (
    <span>...</span>
  );

  return (
    <header className={styles.header}>
      <Title className={styles.title} lineClamp={1} component="h1">
        <Link href="/" className={styles.titleLink}>
          <IconToolsKitchen2 /> Foraging
        </Link>
        {selectedText}
      </Title>
      {selected && <SearchControl />}
    </header>
  );
}
