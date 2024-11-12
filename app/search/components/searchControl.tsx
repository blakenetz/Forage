"use client";
import { ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import styles from "../search.module.css";
import { Transition, TransitionStatus } from "react-transition-group";
import { CSSProperties, useRef } from "react";
import clsx from "clsx";
import Search from "@/components/search";

const defaultStyle: CSSProperties = {
  transform: "translateX(100%)",
  transition: "transform 500ms",
};
const enterStyles: CSSProperties = { transform: "translateX(0)" };

const transitionStyles: Partial<Record<TransitionStatus, CSSProperties>> = {
  entering: enterStyles,
  entered: enterStyles,
};

export default function SearchControl() {
  const ref = useRef<HTMLInputElement>(null);
  const [visible, { open, close }] = useDisclosure(false);

  const handleClick = () => {
    if (!visible) {
      open();
      setTimeout(() => ref.current?.focus(), 600);
    }
  };

  return (
    <Transition in={visible} timeout={500}>
      {(state) => {
        const isActive = state === "entering" || state === "exiting";

        return (
          <Search
            ref={ref}
            classNames={{
              wrapper: clsx(
                styles.searchWrapper,
                isActive && styles.searchWrapperActive
              ),
            }}
            styles={{
              input: { ...defaultStyle, ...transitionStyles[state] },
            }}
            rightSection={
              <ActionIcon variant="subtle" onClick={handleClick} size="sm">
                <IconSearch />
              </ActionIcon>
            }
            leftSection={null}
            size="sm"
            radius="sm"
            onBlur={close}
          />
        );
      }}
    </Transition>
  );
}
