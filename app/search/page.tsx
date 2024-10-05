import { Title } from "@mantine/core";

import { type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  console.log("query", query);
}

export default function Search({
  searchParams,
}: {
  searchParams: { q: string };
}) {
  return (
    <main>
      <Title>Recipeas!</Title>
      {/* <form action={}>
        <TextInput
          leftSection={<IconSearch />}
          name="q"
          aria-label="Search for a recipe"
          placeholder="Find a recipe"
          required
        />
      </form> */}
    </main>
  );
}
