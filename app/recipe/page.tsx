import { redirect } from "next/navigation";
import { fetchRecipeData } from "./actions";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function RecipePage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (!params.url) redirect("/");

  const recipe = await fetchRecipeData(params.url);

  console.log(recipe);

  return (
    <main>
      <h1>Recipe Details</h1>

      {/* Recipe content will be added here */}
    </main>
  );
}
