import { decode } from "he";

import { fetchOttolenghiCatalogue, seriousEatsNewest, type Recipe } from "@/search/data";
import { parseCards } from "@/search/search";
import { seasonOf } from "@/seasons";
import { requestHeaders, type Source } from "@/sources";
import type { NytCollection, NytHomeProps, WordPressPost } from "@/types";

export type Collection = {
  title: string;
  /** the collection on the source's own site */
  url: string;
  recipes: Recipe[];
};

const recipesPerCollection = 6;
/** Sources rotate their collections daily at most; refetch hourly */
const revalidate = 3600;

/** Collections embedded in the cooking.nytimes.com home page's `__NEXT_DATA__` */
async function nytCollections(): Promise<Collection[]> {
  const res = await fetch("https://cooking.nytimes.com/", {
    headers: requestHeaders,
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`NYT Cooking returned ${res.status}`);

  const json = (await res.text()).match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  )?.[1];
  if (!json) throw new Error("NYT Cooking home page has no __NEXT_DATA__");

  const props: NytHomeProps = JSON.parse(json).props.pageProps;

  // the seasonal feature (e.g. "Easy Fall Baking"), then the newest recipes
  return [props.collectionPackage?.firstCollection, props.newestRecipesCollection]
    .filter((collection): collection is NytCollection => !!collection)
    .map((collection) => ({
      title: collection.title,
      url: collection.url,
      recipes: collection.cardData
        .filter((card) => card.type === "recipe")
        .slice(0, recipesPerCollection)
        .map((card) => ({
          title: card.title,
          link: new URL(card.url, "https://cooking.nytimes.com").toString(),
          img: card.image?.src?.card,
          author: card.contentAttribution?.cardByline || undefined,
          meta: {
            time: card.time ?? undefined,
            rating: card.ratings?.avgRating ?? undefined,
            ratingCount: card.ratings?.numRatings ?? undefined,
          },
        })),
    }));
}

async function ottolenghiCollections(): Promise<Collection[]> {
  const catalogue = await fetchOttolenghiCatalogue();
  const season = seasonOf(new Date());
  const url = "https://ottolenghi.co.uk/pages/recipes";

  return [
    {
      title: "Newest recipes",
      url,
      recipes: catalogue
        .slice(0, recipesPerCollection)
        .map(({ recipe }) => recipe),
    },
    {
      title: `${season} recipes`,
      url,
      // skip the newest recipes so the two collections don't repeat each other
      recipes: catalogue
        .slice(recipesPerCollection)
        .filter(({ seasons }) => seasons.includes(season))
        .slice(0, recipesPerCollection)
        .map(({ recipe }) => recipe),
    },
  ];
}

async function mollyBazPosts(filter: string): Promise<Recipe[]> {
  const res = await fetch(
    "https://mollybaz.com/wp-json/wp/v2/posts" +
      `?per_page=${recipesPerCollection}&_embed=wp:featuredmedia&_fields=link,title,_links,_embedded&${filter}`,
    { headers: requestHeaders, next: { revalidate } }
  );
  if (!res.ok) throw new Error(`mollybaz.com returned ${res.status}`);

  const posts: WordPressPost[] = await res.json();

  return posts.map((post) => {
    const media = post._embedded?.["wp:featuredmedia"]?.[0];

    return {
      title: decode(post.title.rendered).trim(),
      link: post.link,
      img: media?.media_details?.sizes?.medium_large?.source_url ?? media?.source_url,
      meta: {},
    };
  });
}

async function mollyBazCollections(): Promise<Collection[]> {
  const url = "https://mollybaz.com/club/all-recipes/";
  // WordPress taxonomy ids: category 7 is "updates" (news, not recipes),
  // secondary_category 26 is "most-popular"
  const [recent, popular] = await Promise.all([
    mollyBazPosts("categories_exclude=7"),
    mollyBazPosts("secondary_category=26"),
  ]);

  return [
    { title: "Recent hits", url, recipes: recent },
    { title: "Most popular", url, recipes: popular },
  ];
}

/** Roundups ("14 Big-Batch Sunday Dinners…", "Our 10 Most-Saved…") lead with a count */
const roundupTitle = /(^|\b(the|our|these)\s)\d+\s/i;

/** Serious Eats' "All Recipes" listing mixes new recipes with roundup articles */
async function seriousEatsCollections(): Promise<Collection[]> {
  const res = await fetch(seriousEatsNewest.url, {
    headers: requestHeaders,
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Serious Eats returned ${res.status}`);

  return [
    {
      title: "Newest recipes",
      url: seriousEatsNewest.url,
      recipes: parseCards(seriousEatsNewest, await res.text())
        .filter(({ title }) => !roundupTitle.test(title))
        .slice(0, recipesPerCollection),
    },
  ];
}

const collectors: Record<Source, () => Promise<Collection[]>> = {
  newYorkTimesCooking: nytCollections,
  seriousEats: seriousEatsCollections,
  ottolenghi: ottolenghiCollections,
  mollyBaz: mollyBazCollections,
};

/** A source that fails yields no collections rather than breaking the page */
export async function getCollections(source: Source): Promise<Collection[]> {
  try {
    const collections = await collectors[source]();
    return collections.filter(({ recipes }) => recipes.length);
  } catch (error) {
    console.log(error);

    return [];
  }
}
