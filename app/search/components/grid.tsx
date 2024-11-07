import NextImage from "next/image";

import {
  Card,
  CardSection,
  Text,
  Title,
  Anchor,
  SimpleGrid,
} from "@mantine/core";

import styles from "../search.module.css";
import Meta from "../meta";
import { fetchRecipeData } from "../actions";
import { PropsWithChildren } from "react";
import { Source } from "../data";

type RecipeGridProps = PropsWithChildren<{
  source: Source;
  query: string;
}>;

export default function RecipeGrid({ source, query }: RecipeGridProps) {
  const data = fetchRecipeData(source, query).then((d) => d);

  return (
    <SimpleGrid cols={5} spacing="xs" className={styles.grid}>
      {Array.isArray(data) &&
        data.map((d) => (
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

              <Title order={3}>{d.title}</Title>
              {d.description && <Text>{d.description}</Text>}
              <Meta {...d.meta} />
            </Card>
          </Anchor>
        ))}
    </SimpleGrid>
  );
}
