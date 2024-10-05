"use client";

import { TextInput, Title } from "@mantine/core";

import styles from "./page.module.css";
import { IconSearch } from "@tabler/icons-react";

import { useFormState } from "react-dom";
import { search } from "./actions";

export default function Home() {
  const [_state, action] = useFormState(search, { error: false });

  return (
    <main className={styles.main}>
      <Title>Recipeas!</Title>
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
      <p>Need inspiration?</p>
    </main>
  );
}
