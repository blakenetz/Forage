"use client";

import { search } from "@/actions";
import { searchProps } from "@/util";
import { ActionIcon, Loader, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import clsx from "clsx";
import { CSSProperties, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Transition, TransitionStatus } from "react-transition-group";
import styles from "../search.module.css";

const defaultStyle: CSSProperties = {
  transform: "translateX(100%)",
  transition: "transform 500ms",
};
const enterStyles: CSSProperties = { transform: "translateX(0)" };

const transitionStyles: Partial<Record<TransitionStatus, CSSProperties>> = {
  entering: enterStyles,
  entered: enterStyles,
};

function Input() {
  const ref = useRef<HTMLInputElement>(null);

  const [visible, { open, close }] = useDisclosure(false);
  const { pending } = useFormStatus();

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
        const inputStyles = { ...defaultStyle, ...transitionStyles[state] };

        return (
          <TextInput
            ref={ref}
            {...searchProps}
            size="sm"
            radius="sm"
            onBlur={close}
            disabled={pending}
            styles={{ input: inputStyles }}
            classNames={{
              wrapper: clsx(
                styles.searchWrapper,
                isActive && styles.searchWrapperActive
              ),
            }}
            rightSection={
              <ActionIcon variant="subtle" onClick={handleClick} size="sm">
                {pending ? <Loader size="sm" /> : <IconSearch />}
              </ActionIcon>
            }
          />
        );
      }}
    </Transition>
  );
}

export default function SearchControl() {
  const [_state, action] = useActionState(search, null);

  return (
    <form action={action}>
      <Input />
    </form>
  );
}
