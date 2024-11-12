import { Center, SimpleGrid, SimpleGridProps, Text } from "@mantine/core";
import styles from "../search.module.css";
import React from "react";

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

export default function Grid({
  children,
  ...props
}: React.PropsWithChildren<Partial<SimpleGridProps>>) {
  return !React.Children.count(children) ? (
    <Center className={defaultGridProps.className}>
      <Text>No results 🤤</Text>
    </Center>
  ) : (
    <SimpleGrid {...defaultGridProps} {...props}>
      {children}
    </SimpleGrid>
  );
}
