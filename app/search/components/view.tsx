"use client";

import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  CardSection,
  InlineStyles,
  MantineBreakpoint,
  Text,
  Title,
  Tooltip,
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
import Header from "./header";
import Aside from "./aside";
import Grid, { defaultGridProps } from "./grid";
import { CSSVariable } from "@/types";

type RecipeGridProps = PropsWithChildren<{
  data: Record<Source, Recipe[]>;
}>;

const sourceMap = new Map<Source, React.ReactElement>([
  ["newYorkTimesCooking", <IconBrandNytimes key="newYorkTimesCooking" />],
  ["epicurious", <IconGlassFull key="epicurious" />],
  ["seriousEats", <IconDumpling key="seriousEats" />],
  ["bonAppetit", <IconSalad key="bonAppetit" />],
]);

export default function RecipeGrid({ data }: RecipeGridProps) {
  const [selected, setSelected] = useState<Source>(sources[0]);
  const [open, { toggle }] = useDisclosure();

  const recipes = data[selected];

  const inlineStyles: CSSVariable = {
    "--search-navbar-width": open
      ? "calc((var(--mantine-spacing-sm) * 2) + 210px)"
      : "calc((var(--mantine-spacing-sm) * 2) + 36px)",
  };
  const cols = defaultGridProps.cols as Record<MantineBreakpoint, number>;
  if (open) {
    cols.base = 1;
    cols.xs = 2;
    cols.sm = 3;
  }

  return (
    <>
      <InlineStyles selector={`.${styles.main}`} styles={inlineStyles} />
      <Header />
      <Aside
        buttons={sources.map((source) => {
          const button = (
            <Button
              variant={selected === source ? "filled" : "subtle"}
              key={source}
              fullWidth
              leftSection={sourceMap.get(source)}
              onClick={() => setSelected?.(source)}
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
        actionIcon={
          <ActionIcon onClick={toggle} size="lg" color="blue.9" m="sm">
            {open ? (
              <IconLayoutSidebarLeftCollapse />
            ) : (
              <IconLayoutSidebarLeftExpand />
            )}
          </ActionIcon>
        }
      />

      <Grid cols={cols}>
        {recipes.map((d) => (
          <Anchor
            href={d.link}
            rel="noopener noreferrer"
            target="__blank"
            key={d.link}
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
                  unoptimized
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
      </Grid>
    </>
  );
}
