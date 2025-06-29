export const sources = [
  "newYorkTimesCooking",
  "epicurious",
  "bonAppetit",
  "seriousEats",
] as const;

export type Source = (typeof sources)[number];

export type RecipeData = RecipeMeta & {
  title: string;
  img: string;
  link: string;
  author?: string;
  description?: string;
};

export type RecipeMeta = {
  rating?: number;
  ratingCount?: number;
  time?: string;
  tags?: string;
};

export type Recipe = Omit<RecipeData, keyof RecipeMeta> & { meta: RecipeMeta };
