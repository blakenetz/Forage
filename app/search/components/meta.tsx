import { IconStarFilled, IconStar, IconClock } from "@tabler/icons-react";
import { Stack, Group, Text } from "@mantine/core";
import styles from "../search.module.css";
import { Recipe } from "../data";

export default function Meta(props: Recipe["meta"]) {
  if (!props) return null;

  const { rating, ratingCount, time } = props;

  return (
    <Stack mt="md" gap={5}>
      {rating && (
        <Group gap={5}>
          <Group gap={0}>
            {Array.from({ length: 5 }, (_val, i) =>
              i + 1 <= rating ? true : false
            ).map((filled, i) =>
              filled ? (
                <IconStarFilled key={i} size="1rem" />
              ) : (
                <IconStar key={i} size="1rem" />
              )
            )}
          </Group>
          {ratingCount && <Text size="xs">{ratingCount}</Text>}
        </Group>
      )}

      {time && (
        <Group className={styles.time}>
          <IconClock size="1rem" />
          <Text size="xs">{time}</Text>
        </Group>
      )}
    </Stack>
  );
}
