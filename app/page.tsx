import { Text, Title } from "@mantine/core";

import Form from "./components/form";
import styles from "./home.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <Title>Forage!</Title>
      <Text>Find your next meal</Text>
      <Form />
    </main>
  );
}
