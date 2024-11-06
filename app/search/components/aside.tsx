"use client";

import { ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import styles from "../search.module.css";
import { Source, sources } from "../data";
import {
  IconBrandNytimes,
  IconDumpling,
  IconGlassFull,
  IconSalad,
} from "@tabler/icons-react";

export const sourceMap = new Map<Source, React.ReactElement>([
  ["newYorkTimesCooking", <IconBrandNytimes key="newYorkTimesCooking" />],
  ["epicurious", <IconGlassFull key="epicurious" />],
  ["seriousEats", <IconDumpling key="seriousEats" />],
  ["bonAppetit", <IconSalad key="bonAppetit" />],
]);

export default function Aside() {
  const [open, { toggle }] = useDisclosure(true);

  return (
    <aside className={open ? styles.open : styles.close}>
      <ActionIcon onClick={toggle}>
        {open ? (
          <IconLayoutSidebarLeftExpand />
        ) : (
          <IconLayoutSidebarLeftCollapse />
        )}
      </ActionIcon>
      {sources.map((source) => (
        <ActionIcon key={source}>{sourceMap.get(source)}</ActionIcon>
      ))}
    </aside>
  );
}
