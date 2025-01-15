"use client";

import { TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { searchProps } from "../util";
import { useActionState } from "react";
import { search } from "@/actions";

export default function Form() {
  const [_state, action, isPending] = useActionState(search, null);

  return (
    <form action={action}>
      <TextInput
        leftSection={<IconSearch />}
        size="lg"
        radius="lg"
        {...searchProps}
        {...(isPending && { disabled: true })}
      />
    </form>
  );
}
