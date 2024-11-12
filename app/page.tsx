import { Text, TextInput, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import styles from "./home.module.css";
import { getQuery, param, searchProps } from "./util";
import { redirect } from "next/navigation";

export default function Home() {
  async function search(formData: FormData) {
    "use server";

    const value = getQuery(formData);

    if (value) {
      const searchParams = new URLSearchParams({ [param]: value });
      redirect(`/search?${searchParams.toString()}`);
    }
  }

  return (
    <main className={styles.main}>
      <Title>Forage!</Title>
      <Text>Find your next meal</Text>
      <form action={search}>
        <TextInput
          leftSection={<IconSearch />}
          size="lg"
          radius="lg"
          {...searchProps}
        />
      </form>
    </main>
  );
}
