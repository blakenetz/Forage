"use client";
import { ActionIcon, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import styles from "../search.module.css";
import { Transition, TransitionStatus } from "react-transition-group";
import { CSSProperties, useRef } from "react";
import clsx from "clsx";

const defaultStyle: CSSProperties = {
  transform: "translateX(100%)",
  transition: "transform 500ms",
};

const transitionStyles: Partial<Record<TransitionStatus, CSSProperties>> = {
  entering: { transform: "translateX(0)" },
  entered: { transform: "translateX(0)" },
  exiting: defaultStyle,
  exited: defaultStyle,
};

export default function SearchControl() {
  const [open, { toggle }] = useDisclosure(false);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Transition in={open} timeout={500}>
      {(state) => {
        const isActive = state === "entering" || state === "exiting";

        return (
          <TextInput
            classNames={{
              wrapper: clsx(
                styles.searchWrapper,
                isActive && styles.searchWrapperActive
              ),
            }}
            ref={ref}
            styles={{ input: { ...defaultStyle, ...transitionStyles[state] } }}
            rightSection={
              <ActionIcon variant="subtle" onClick={toggle}>
                <IconSearch />
              </ActionIcon>
            }
          />
        );
      }}
    </Transition>
  );
}
