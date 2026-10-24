export type MetaobjectField = { value: string } | null;

export type OttolenghiRecipe = {
  onlineStoreUrl: string | null;
  title: MetaobjectField;
  description: MetaobjectField;
  /** JSON-encoded string arrays */
  main_ingredient: MetaobjectField;
  meal: MetaobjectField;
  collection: MetaobjectField;
  season: MetaobjectField;
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

/** A card in a collection embedded in cooking.nytimes.com's `__NEXT_DATA__` */
export type NytCard = {
  type: string;
  title: string;
  /** site-relative */
  url: string;
  time?: string | null;
  contentAttribution?: { cardByline?: string };
  image?: { src?: { card?: string } };
  ratings?: { avgRating: number | null; numRatings: number | null };
};

export type NytCollection = {
  title: string;
  url: string;
  cardData: NytCard[];
};

/** The parts of the cooking.nytimes.com home page props that Forage reads */
export type NytHomeProps = {
  newestRecipesCollection?: NytCollection;
  collectionPackage?: { firstCollection?: NytCollection };
};

/** A post from the WordPress REST API, requested with `_embed=wp:featuredmedia` */
export type WordPressPost = {
  link: string;
  title: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: {
      source_url: string;
      media_details?: { sizes?: Record<string, { source_url: string }> };
    }[];
  };
};
