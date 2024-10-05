import NextImage from "next/image";

import {
  Card,
  CardSection,
  Text,
  Title,
  Anchor,
  SimpleGrid,
  AccordionItem,
  AccordionPanel,
  AccordionControl,
} from "@mantine/core";

import styles from "./search.module.css";
import Meta from "./meta";
import {
  IconBrandNytimes,
  IconDumpling,
  IconGlassFull,
  IconSalad,
} from "@tabler/icons-react";
import { fetchRecipeData } from "./actions";
import { PropsWithChildren } from "react";
import { Source } from "./data";

type RecipeGridProps = PropsWithChildren<{
  source: Source;
  query: string;
}>;

const info: Record<Source, { icon: React.ReactElement; title: string }> = {
  nyTimes: {
    title: "New York Times Cooking",
    icon: <IconBrandNytimes />,
  },
  seriousEats: { title: "Serious Eats", icon: <IconDumpling /> },
  bonAppetit: { title: "Bon Appetit", icon: <IconSalad /> },
  epicurious: { title: "Epicurious", icon: <IconGlassFull /> },
};

export default async function RecipeGrid({ source, query }: RecipeGridProps) {
  const data = await fetchRecipeData(source, query);
  const { title, icon } = info[source];

  return (
    <AccordionItem value={source}>
      <AccordionControl icon={icon}>{title}</AccordionControl>
      <AccordionPanel>
        <SimpleGrid cols={5} spacing="xs">
          {data.map((d) => (
            <Anchor
              key={d.title}
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
      </AccordionPanel>
    </AccordionItem>
  );
}
