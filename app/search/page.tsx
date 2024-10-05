import NextImage from "next/image";

import { param } from "@/util";
import { Card, CardSection, Group, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";

import { type NextRequest } from "next/server";
import { queryNyTimes } from "./actions";
import styles from "./search.module.css";

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
  console.log(data);

  return (
    <main className={styles.main}>
      <Title>Recipeas!</Title>
      <section className={styles.results}>
        <section className={styles.section}>
          {data.map((d) => (
            <Card key={d.title} shadow="sm" padding="lg" radius="md" withBorder>
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
            </Card>
          ))}
        </section>
      </section>
    </main>
  );
}
