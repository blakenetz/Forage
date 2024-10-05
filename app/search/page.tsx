import NextImage from "next/image";

import { param } from "@/util";
import {
  Card,
  CardSection,
  Text,
  Title,
  Anchor,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionControl,
} from "@mantine/core";
import { redirect } from "next/navigation";

import { type NextRequest } from "next/server";
import { queryNyTimes } from "./actions";
import styles from "./search.module.css";
import Meta from "./meta";
import { IconBrandNytimes } from "@tabler/icons-react";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get(param);
  if (!query) redirect("/");
  return query;
}

export default async function Search({
  searchParams,
}: {
  searchParams: { [param]: string };
}) {
  const query = searchParams[param];
  const data = await queryNyTimes(query);

  return (
    <main className={styles.main}>
      <Title>Recipeas!</Title>
      <Accordion variant="filled">
        <AccordionItem value="nyTimes">
          <AccordionControl icon={<IconBrandNytimes />}>
            New York Times Cooking
          </AccordionControl>
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
      </Accordion>
    </main>
  );
}
