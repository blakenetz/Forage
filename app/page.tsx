import { Text, Title } from "@mantine/core";

import styles from "./home.module.css";
import Search from "./components/search";

export default function Home() {
  return (
    <main className={styles.main}>
      <Title>Forage!</Title>
      <Text>Find your next meal</Text>
      <Search />
    </main>
  );
}
