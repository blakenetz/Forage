import NextImage from "next/image";

import { param } from "@/util";
import { Card, CardSection, Title } from "@mantine/core";
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
        <section className={styles.sections}>
          {data.map((d) => (
            <Card key={d.title}>
              <CardSection>
                <NextImage
                  src={d.img}
                  alt={d.title}
                  sizes="300px"
                  fill
                  style={{
                    objectFit: "contain",
                  }}
                />
              </CardSection>
              <Title order={3}>{d.title}</Title>
            </Card>
          ))}
        </section>
      </section>
    </main>
  );
}
