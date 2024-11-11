import { ActionIcon, InlineStyles, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import styles from "../search.module.css";
import { CSSVariable } from "@/types";

export default function SearchControl() {
  const [open, { toggle }] = useDisclosure(false);

  const inlineStyles: CSSVariable = {
    "--search-translate": open ? "0" : "100%",
  };

  return (
    <>
      <InlineStyles selector={`.${styles.searchInput}`} styles={inlineStyles} />
      <TextInput
        classNames={{
          input: styles.searchInput,
          wrapper: styles.searchWrapper,
        }}
        rightSection={
          <ActionIcon variant="subtle" onClick={toggle}>
            <IconSearch />
          </ActionIcon>
        }
      />
    </>
  );
}
