"use client";

import { search } from "@/actions";
import { TextInput, TextInputProps } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useFormState } from "react-dom";

export default function Search(props: Partial<TextInputProps>) {
  const [_state, action] = useFormState(search, { error: false });

  return (
    <form action={action}>
      <TextInput
        leftSection={<IconSearch />}
        name="q"
        aria-label="Search for a recipe"
        placeholder="Find a recipe"
        size="lg"
        radius="lg"
        {...props}
      />
    </form>
  );
}
