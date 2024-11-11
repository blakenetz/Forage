import { InlineStyles, Skeleton, useMantineContext } from "@mantine/core";
import Aside from "./components/aside";
import Grid from "./components/grid";
import Header from "./components/header";
import { sources } from "./data";

export default function Loading() {
  const ctx = useMantineContext();

  return (
    <>
      <Header />
      <Aside
        buttons={sources.map((s) => (
          <Skeleton key={s} height={36} />
        ))}
        actionIcon={<Skeleton height={32} />}
      />
      <Grid>
        {Array.from({ length: 20 }, (_v, i) => i).map((key) => (
          <Skeleton key={key} height={300} />
        ))}
      </Grid>
    </>
  );
}
