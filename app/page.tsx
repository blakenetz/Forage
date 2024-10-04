import { TextInput, Title } from "@mantine/core";
import styles from "./page.module.css";
import { IconSearch } from "@tabler/icons-react";
import { search } from "./actions";

export default function Home() {
  async function query(formData: FormData) {
    "use server";
    const data = await search(formData);
    // console.log(data);
  }

  return (
    <main className={styles.main}>
      <Title>Recipeas!</Title>
      <form action={query}>
        <TextInput
          leftSection={<IconSearch />}
          name="search"
          aria-label="Search for a recipe"
          placeholder="Find a recipe"
        />
      </form>
    </main>
  );
}
