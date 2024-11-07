"use client";

import { ActionIcon, Button } from "@mantine/core";
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
import clsx from "clsx";
import { startCase } from "lodash";

export const sourceMap = new Map<Source, React.ReactElement>([
  ["newYorkTimesCooking", <IconBrandNytimes key="newYorkTimesCooking" />],
  ["epicurious", <IconGlassFull key="epicurious" />],
  ["seriousEats", <IconDumpling key="seriousEats" />],
  ["bonAppetit", <IconSalad key="bonAppetit" />],
]);

export default function Aside() {
  const [open, { toggle }] = useDisclosure();

  return (
    <aside className={clsx(styles.aside, open ? styles.open : styles.close)}>
      <ActionIcon onClick={toggle} size="lg">
        {open ? (
          <IconLayoutSidebarLeftExpand />
        ) : (
          <IconLayoutSidebarLeftCollapse />
        )}
      </ActionIcon>
      {sources.map((source) => {
        const icon = sourceMap.get(source);
        return open ? (
          <Button key={source} fullWidth leftSection={icon}>
            {startCase(source)}
          </Button>
        ) : (
          <ActionIcon key={source} size="lg">
            {icon}
          </ActionIcon>
        );
      })}
    </aside>
  );
}
