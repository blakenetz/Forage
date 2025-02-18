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

export type CSSVariable = Record<`--${string}`, string | undefined> &
  React.CSSProperties;
