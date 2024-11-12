import { search } from "@/actions";
import { TextInput, TextInputProps } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import React from "react";

const Search = React.forwardRef<HTMLInputElement, Partial<TextInputProps>>(
  (props, ref) => {
    return (
      <form action={search}>
        <TextInput
          ref={ref}
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
);
Search.displayName = "Search";
export default Search;
