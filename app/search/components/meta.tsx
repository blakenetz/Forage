import { IconStarFilled, IconStar, IconClock } from "@tabler/icons-react";
import { Group, Text } from "@mantine/core";
import styles from "./search.module.css";
import { Recipe } from "../data";

export default function Meta(props: Recipe["meta"]) {
  if (!props) return null;
  const { rating, ratingCount, time } = props;

  return (
    <div>
      {rating && (
        <Group gap="0">
          {Array.from({ length: 5 }, (_val, i) =>
            i + 1 <= rating ? true : false
          ).map((filled, i) =>
            filled ? <IconStarFilled key={i} /> : <IconStar key={i} />
          )}
        </Group>
      )}
      {ratingCount && <Text size="xs">{ratingCount}</Text>}
      {time && (
        <Group className={styles.time}>
          <IconClock />
          <Text size="xs">{time}</Text>
        </Group>
      )}
    </div>
  );
}
