import { SimpleGrid, SimpleGridProps } from "@mantine/core";
import styles from "../search.module.css";
import { PropsWithChildren } from "react";

export const defaultGridProps: SimpleGridProps = {
  cols: {
    base: 2,
    xs: 3,
    sm: 4,
    md: 4,
    lg: 5,
  },
  spacing: "xs",
  className: styles.grid,
};

export default function Grid(
  props: PropsWithChildren<Partial<SimpleGridProps>>
) {
  return <SimpleGrid {...defaultGridProps} {...props} />;
}
