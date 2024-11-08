"use client";

import { Text, TextInput, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useFormState } from "react-dom";
import { search } from "./actions";
import styles from "./home.module.css";

export default function Home() {
  const [_state, action] = useFormState(search, { error: false });

  return (
    <main className={styles.main}>
      <Title>Forage!</Title>
      <Text>Find your next meal</Text>
      <form action={action}>
        <TextInput
          leftSection={<IconSearch />}
          name="q"
          aria-label="Search for a recipe"
          placeholder="Find a recipe"
          size="lg"
          radius="lg"
        />
      </form>
    </main>
  );
}
