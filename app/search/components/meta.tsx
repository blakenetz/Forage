import {
  IconStarFilled,
  IconStar,
  IconClock,
  IconTagStarred,
} from "@tabler/icons-react";
import { Stack, Group, Text } from "@mantine/core";
import styles from "../search.module.css";
import { Recipe } from "../data";

export default function Meta(props: Recipe["meta"]) {
  if (!props) return null;

  const { rating, ratingCount, time, tags } = props;

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
        <Text size="xs" className={styles.small}>
          <IconClock size="1rem" /> {time}
        </Text>
      )}

      {tags && (
        <Text size="xs" className={styles.small}>
          <IconTagStarred size="1rem" /> {tags}
        </Text>
      )}
    </Stack>
  );
}
