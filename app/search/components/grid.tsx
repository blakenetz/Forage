"use client";

import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  CardSection,
  InlineStyles,
  SimpleGrid,
  Text,
  Title,
  useMantineContext,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrandNytimes,
  IconDumpling,
  IconGlassFull,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSalad,
} from "@tabler/icons-react";
import { startCase } from "lodash";
import NextImage from "next/image";
import { PropsWithChildren, useState } from "react";

import { Recipe, Source, sources } from "../data";
import Meta from "./meta";
import styles from "../search.module.css";

export const sourceMap = new Map<Source, React.ReactElement>([
  ["newYorkTimesCooking", <IconBrandNytimes key="newYorkTimesCooking" />],
  ["epicurious", <IconGlassFull key="epicurious" />],
  ["seriousEats", <IconDumpling key="seriousEats" />],
  ["bonAppetit", <IconSalad key="bonAppetit" />],
]);

type RecipeGridProps = PropsWithChildren<{
  data: Record<Source, Recipe[]>;
}>;

type CSSVariable = Record<`--${string}`, string | undefined> &
  React.CSSProperties;

export default function RecipeGrid({ data }: RecipeGridProps) {
  const [selected, setSelected] = useState<Source>(sources[0]);
  const [open, { toggle }] = useDisclosure();
  const ctx = useMantineContext();

  const recipes = data[selected];

  const inlineStyles: CSSVariable = {
    "--search-navbar-width": open
      ? "calc((var(--mantine-spacing-sm) * 2) + 240px)"
      : "calc((var(--mantine-spacing-sm) * 2) + 36px)",
  };

  return (
    <>
      <InlineStyles selector={ctx.cssVariablesSelector} styles={inlineStyles} />
      <aside className={styles.aside}>
        <div>
          {sources.map((source) => (
            <Button
              variant={selected === source ? "filled" : "subtle"}
              key={source}
              fullWidth
              leftSection={sourceMap.get(source)}
              onClick={() => setSelected(source)}
              justify="flex-start"
            >
              {startCase(source)}
            </Button>
          ))}
        </div>
        <ActionIcon onClick={toggle} size="lg" color="blue.9" m="sm">
          {open ? (
            <IconLayoutSidebarLeftExpand />
          ) : (
            <IconLayoutSidebarLeftCollapse />
          )}
        </ActionIcon>
      </aside>

      <SimpleGrid cols={5} spacing="xs" className={styles.grid}>
        {recipes.map((d) => (
          <Anchor
            key={d.link}
            href={d.link}
            rel="noopener noreferrer"
            target="__blank"
          >
            <Card
              shadow="sm"
              padding="xs"
              radius="md"
              withBorder
              className={styles.card}
            >
              <CardSection className={styles.imageWrapper}>
                <NextImage
                  src={d.img}
                  alt={d.title}
                  sizes="300px"
                  fill
                  className={styles.image}
                />
              </CardSection>

              <Title order={4} className={styles.cardTitle}>
                {d.title}
              </Title>
              {d.description && <Text>{d.description}</Text>}
              <Meta {...d.meta} />
            </Card>
          </Anchor>
        ))}
      </SimpleGrid>
    </>
  );
}
