"use client";

import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  CardSection,
  InlineStyles,
  SimpleGrid,
  SimpleGridProps,
  Text,
  Title,
  Tooltip,
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
  IconToolsKitchen2,
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
      ? "calc((var(--mantine-spacing-sm) * 2) + 210px)"
      : "calc((var(--mantine-spacing-sm) * 2) + 36px)",
  };

  const cols: SimpleGridProps["cols"] = { base: 2, xs: 3, sm: 4, md: 4, lg: 5 };
  if (open) {
    cols.base = 1;
    cols.xs = 2;
    cols.sm = 3;
  }

  return (
    <>
      <InlineStyles selector={ctx.cssVariablesSelector} styles={inlineStyles} />
      <Title className={styles.title} lineClamp={1}>
        <IconToolsKitchen2 /> {startCase(selected)}
      </Title>
      <aside className={styles.aside}>
        <div>
          {sources.map((source) => {
            const button = (
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
            );

            return open ? (
              button
            ) : (
              <Tooltip
                key={source}
                label={startCase(source)}
                events={{ hover: true, focus: true, touch: false }}
              >
                {button}
              </Tooltip>
            );
          })}
        </div>
        <ActionIcon onClick={toggle} size="lg" color="blue.9" m="sm">
          {open ? (
            <IconLayoutSidebarLeftCollapse />
          ) : (
            <IconLayoutSidebarLeftExpand />
          )}
        </ActionIcon>
      </aside>

      <SimpleGrid cols={cols} spacing="xs" className={styles.grid}>
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
              {d.author && <Text size="sm">{d.author}</Text>}
              {d.description && (
                <Text size="sm" c="dimmed" lineClamp={4}>
                  {d.description}
                </Text>
              )}
              <Meta {...d.meta} />
            </Card>
          </Anchor>
        ))}
      </SimpleGrid>
    </>
  );
}
