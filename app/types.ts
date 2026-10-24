export type EpicuriousRecipe = {
  id: string;
  contentType: "recipe" | "gallery";
  dangerousHed: string;
  dangerousDek: string;
  url: string;
  rating?: number;
  reviewsCount?: number;
  image: {
    sources: Record<
      "sm" | "md" | "lg" | "xl",
      { aspectRatio: string; url: string }
    >;
  };
  imageLabels: string[];
  contributors: {
    author: {
      items: {
        dangerousBio: string;
        dangerousTitle: string;
        name: string;
        url: string;
      }[];
    };
  };
};

export type MetaobjectField = { value: string } | null;

export type OttolenghiRecipe = {
  onlineStoreUrl: string | null;
  title: MetaobjectField;
  description: MetaobjectField;
  /** JSON-encoded string arrays */
  main_ingredient: MetaobjectField;
  meal: MetaobjectField;
  collection: MetaobjectField;
  images: {
    references: { nodes: { image?: { url: string } }[] } | null;
  } | null;
};

export type OttolenghiRecipesResponse = {
  data: {
    metaobjects: {
      nodes: OttolenghiRecipe[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
};

export type CSSVariable = Record<`--${string}`, string | undefined> &
  React.CSSProperties;
