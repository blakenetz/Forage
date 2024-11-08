import { Text, Title } from "@mantine/core";
import { IconToolsKitchen2 } from "@tabler/icons-react";
import { startCase } from "lodash";
import React from "react";
import styles from "../search.module.css";
import { Source } from "../data";

export default function Header({ selected }: { selected?: Source }) {
  const selectedText = selected ? (
    <>
      :
      <Text component="span" c="dimmed">
        {startCase(selected)}
      </Text>
    </>
  ) : (
    "..."
  );
  return (
    <Title className={styles.title} lineClamp={1} component="h1">
      <IconToolsKitchen2 /> Foraging{selectedText}
    </Title>
  );
}
