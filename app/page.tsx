import { TextInput, Title } from "@mantine/core";
import styles from "./page.module.css";
import { IconSearch } from "@tabler/icons-react";

export default function Home() {
  return (
    <main className={styles.main}>
      <Title>Recipeas!</Title>
      <form action="/search">
        <TextInput
          leftSection={<IconSearch />}
          name="q"
          aria-label="Search for a recipe"
          placeholder="Find a recipe"
          required
        />
      </form>
    </main>
  );
}
