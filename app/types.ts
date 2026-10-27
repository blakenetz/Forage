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

/** A collection NYT features on its home page; named rather than titled */
export type NytFeaturedCollection = Omit<NytCollection, "title"> & { name: string };

/** The parts of the cooking.nytimes.com home page props that Forage reads */
export type NytHomeProps = {
  newestRecipesCollection?: NytCollection;
  featuredCollections?: NytFeaturedCollection[];
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

/** An item from Flipp's item search (backflipp.wishabi.com), which reads stores' weekly ads */
export type FlippItem = {
  name: string;
  merchant_name: string;
  /** top-level product category, e.g. "Food, Beverages & Tobacco" */
  _L1: string | null;
  /** "2 FOR" */
  pre_price_text: string | null;
  current_price: number | null;
  /** "/EA* With Card", "/LB." */
  post_price_text: string | null;
  original_price: number | null;
  /** "BUY ONE, GET ONE 50% OFF regular retail of equal or lesser value" */
  sale_story: string | null;
  valid_to: string;
};

/** A store in the Whole Foods store finder (/aplf/list), nearest the zip code's middle first */
export type WholeFoodsLocation = {
  /** the store id the sales flyer takes, e.g. "10626" */
  storeCode: string;
  locationName: string;
  address: { addressLines: string[]; city: string };
  geocode: { latitude: number; longitude: number };
  /** miles from the middle of the zip code */
  distance: number;
};

/** A promotion in the Whole Foods sales flyer's `__NEXT_DATA__` */
export type WholeFoodsPromotion = {
  /** a brand or a descriptor: "Rao's", "Organic", "" */
  originBrandName: string;
  productName: string;
  /** "$3.99/lb", "$1.49 to $7.49", "Regular prices vary" */
  regularPrice: string;
  /** "$3.32/lb", "16% off", "2 for $5.56", or empty */
  salePrice: string;
  /** the Prime member price, or a footnote like "*Excluded from the extra 10% off" */
  primePrice: string;
  endDate: string;
};
