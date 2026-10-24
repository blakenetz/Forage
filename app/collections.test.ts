import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCollections } from "@/collections";
import {
  ottolenghiCatalogue,
  ottolenghiHost,
  ottolenghiRecipe,
  seriousEatsCard,
  stubFetch,
} from "@/testing";
import type { NytCard, NytHomeProps } from "@/types";

function nytCard(title: string, overrides: Partial<NytCard> = {}): NytCard {
  return {
    type: "recipe",
    title,
    url: `/recipes/${title.toLowerCase().replace(/\W+/g, "-")}`,
    time: "1 hour",
    contentAttribution: { cardByline: "Sue Li" },
    image: { src: { card: `https://static01.nyt.com/${title}.jpg` } },
    ratings: { avgRating: 5, numRatings: 120 },
    ...overrides,
  };
}

function nytHomePage(pageProps: NytHomeProps) {
  const data = JSON.stringify({ props: { pageProps } });
  return `<html><body><script id="__NEXT_DATA__" type="application/json">${data}</script></body></html>`;
}

describe("getCollections", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("reads NYT Cooking's seasonal feature and newest recipes from its home page data", async () => {
    stubFetch({
      "cooking.nytimes.com": nytHomePage({
        collectionPackage: {
          firstCollection: {
            title: "Easy Fall Baking",
            url: "https://cooking.nytimes.com/68861692-nyt-cooking/44793461-easy-fall-baking",
            cardData: [
              nytCard("How to Make Pie Crust", { type: "guide" }),
              ...["Apple Crisp", "Pumpkin Bread", "Spice Cake", "Scones", "Crumb Cake", "Galette", "Cobbler"].map((title) => nytCard(title)),
            ],
          },
        },
        newestRecipesCollection: {
          title: "Our Newest Recipes",
          url: "https://cooking.nytimes.com/68861692-nyt-cooking/32998034-our-newest-recipes",
          cardData: [
            nytCard("Vegetarian Borscht", {
              time: null,
              contentAttribution: { cardByline: "" },
              image: {},
              ratings: { avgRating: null, numRatings: null },
            }),
          ],
        },
      }),
    });

    const [fallBaking, newest] = await getCollections("newYorkTimesCooking");

    expect(fallBaking.title).toBe("Easy Fall Baking");
    // guides are skipped and each collection shows six recipes
    expect(fallBaking.recipes.map((recipe) => recipe.title)).toEqual([
      "Apple Crisp",
      "Pumpkin Bread",
      "Spice Cake",
      "Scones",
      "Crumb Cake",
      "Galette",
    ]);
    expect(fallBaking.recipes[0]).toEqual({
      title: "Apple Crisp",
      link: "https://cooking.nytimes.com/recipes/apple-crisp",
      img: "https://static01.nyt.com/Apple Crisp.jpg",
      author: "Sue Li",
      meta: { time: "1 hour", rating: 5, ratingCount: 120 },
    });
    expect(newest).toEqual({
      title: "Our Newest Recipes",
      url: "https://cooking.nytimes.com/68861692-nyt-cooking/32998034-our-newest-recipes",
      recipes: [
        {
          title: "Vegetarian Borscht",
          link: "https://cooking.nytimes.com/recipes/vegetarian-borscht",
          img: undefined,
          author: undefined,
          meta: { time: undefined, rating: undefined, ratingCount: undefined },
        },
      ],
    });
  });

  it("has no NYT Cooking collections when the home page lacks its data", async () => {
    stubFetch({ "cooking.nytimes.com": "<html><body>Hello</body></html>" });

    expect(await getCollections("newYorkTimesCooking")).toEqual([]);
  });

  it("follows Ottolenghi's newest recipes with this season's, without repeats", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z"), toFake: ["Date"] });
    const newest = Array.from({ length: 6 }, (_, i) =>
      ottolenghiRecipe(`New ${i + 1}`, { season: ["Autumn"] })
    );
    stubFetch({
      [ottolenghiHost]: ottolenghiCatalogue([
        newest,
        [
          ottolenghiRecipe("Summer tomatoes", { season: ["Summer"] }),
          ottolenghiRecipe("Squash and lentils", { season: ["Autumn", "Winter"] }),
          ottolenghiRecipe("Draft stew", { season: ["Autumn"] }, null),
        ],
      ]),
    });

    const collections = await getCollections("ottolenghi");

    expect(
      collections.map(({ title, recipes }) => [
        title,
        recipes.map((recipe) => recipe.title),
      ])
    ).toEqual([
      ["Newest recipes", newest.map((recipe) => recipe.title!.value)],
      ["Autumn recipes", ["Squash and lentils"]],
    ]);
  });

  it("drops a collection that has no recipes", async () => {
    vi.useFakeTimers({ now: new Date("2026-07-01T12:00:00Z"), toFake: ["Date"] });
    stubFetch({
      [ottolenghiHost]: ottolenghiCatalogue([
        [ottolenghiRecipe("Only one", { season: ["Winter"] })],
      ]),
    });

    const collections = await getCollections("ottolenghi");

    expect(collections.map(({ title }) => title)).toEqual(["Newest recipes"]);
  });

  it("reads Molly Baz's recent and most popular recipes from WordPress", async () => {
    const fetchMock = stubFetch({
      "mollybaz.com": (_init, url) =>
        JSON.stringify([
          {
            link: "https://mollybaz.com/tuna-surprise/",
            title: { rendered: "Tuna Surprise &#8217;26 " },
            _embedded: {
              "wp:featuredmedia": [
                {
                  source_url: "https://mollybaz.com/tuna-scaled.jpg",
                  media_details: {
                    sizes: {
                      medium_large: {
                        source_url: "https://mollybaz.com/tuna-768x945.jpg",
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            link: `https://mollybaz.com/${url.searchParams.has("secondary_category") ? "popular" : "recent"}/`,
            title: { rendered: "No sizes" },
            _embedded: {
              "wp:featuredmedia": [{ source_url: "https://mollybaz.com/full.jpg" }],
            },
          },
        ]),
    });

    const [recent, popular] = await getCollections("mollyBaz");

    const requested = fetchMock.mock.calls.map(
      ([input]) => new URL(input.toString()).searchParams
    );
    expect(requested.map((params) => params.get("categories_exclude"))).toEqual(["7", null]);
    expect(requested.map((params) => params.get("secondary_category"))).toEqual([null, "26"]);
    expect(recent.title).toBe("Recent hits");
    expect(recent.recipes).toEqual([
      {
        title: "Tuna Surprise ’26",
        link: "https://mollybaz.com/tuna-surprise/",
        img: "https://mollybaz.com/tuna-768x945.jpg",
        meta: {},
      },
      {
        title: "No sizes",
        link: "https://mollybaz.com/recent/",
        img: "https://mollybaz.com/full.jpg",
        meta: {},
      },
    ]);
    expect(popular.title).toBe("Most popular");
    expect(popular.recipes[1].link).toBe("https://mollybaz.com/popular/");
  });

  it("has no Molly Baz collections when WordPress fails", async () => {
    stubFetch({ "mollybaz.com": new Response("down", { status: 503 }) });

    expect(await getCollections("mollyBaz")).toEqual([]);
  });

  it("lists Serious Eats' newest recipes, skipping roundup articles", async () => {
    const listing: [title: string, slug: string][] = [
      ["Pierogi Stuffed Shells", "pierogi-stuffed-shells-1"],
      ["The 10 Comfort Food Recipes Our Readers Are Saving", "most-saved-2"],
      ["14 Big-Batch Sunday Dinners", "big-batch-3"],
      ["Forget Frozen Pot Pies—These 9 Homemade Savory Pies", "pot-pies-4"],
      ["5-Minute Aioli", "aioli-recipe-5"],
      ...Array.from({ length: 6 }, (_, i): [string, string] => [
        `Recipe ${i + 6}`,
        `recipe-${i + 6}`,
      ]),
    ];
    stubFetch({
      "www.seriouseats.com": `
<div class="comp mntl-three-post__inner">${seriousEatsCard(...listing[0])}</div>
<div class="comp tax-sc__recirc-list">${listing
        .slice(1)
        .map(([title, slug]) => seriousEatsCard(title, slug))
        .join("")}</div>
<footer>${seriousEatsCard("Follow Us", "social")}</footer>`,
    });

    const [newest] = await getCollections("seriousEats");

    expect(newest.title).toBe("Newest recipes");
    expect(newest.url).toBe("https://www.seriouseats.com/all-recipes-5117985");
    expect(newest.recipes.map((recipe) => recipe.title)).toEqual([
      "Pierogi Stuffed Shells",
      "5-Minute Aioli",
      "Recipe 6",
      "Recipe 7",
      "Recipe 8",
      "Recipe 9",
    ]);
    expect(newest.recipes[0]).toEqual({
      title: "Pierogi Stuffed Shells",
      img: "https://www.seriouseats.com/thmb/pierogi-stuffed-shells-1.jpg",
      link: "https://www.seriouseats.com/pierogi-stuffed-shells-1",
      author: "Kenji López-Alt",
      description: undefined,
      meta: {
        rating: undefined,
        ratingCount: undefined,
        time: undefined,
        tags: undefined,
      },
    });
  });

  it("has no Serious Eats collections when the site refuses the request", async () => {
    stubFetch({
      "www.seriouseats.com": new Response("blocked", { status: 403 }),
    });

    expect(await getCollections("seriousEats")).toEqual([]);
  });
});
