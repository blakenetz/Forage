import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ottolenghiCatalogue,
  ottolenghiHost,
  ottolenghiRecipe,
  seriousEatsCard,
  stubFetch,
} from "@/testing";

import { searchSource } from "./search";

const nytHtml = `
<ul>
  <li>
    <div class="recipecard_recipeCard__yTYhK">
      <article class="atoms_card__MIRyu">
        <a class="link_link__7WCQy link_default__lKxiG" href="/recipes/123-pasta">
          <figure><img alt="" class="cardimage_image__EYWRG" src="https://static01.nyt.com/pasta.jpg"></figure>
          <section class="atoms_textBlock__QKkI_">
            <h3 class="pantry--ui-strong atoms_cardTitle__aAeYE">Pasta &amp; Peas</h3>
            <p class="pantry--ui-sm recipecard_byline__tf4y0">Melissa Clark</p>
            <div class="recipecard_recipeCardRating__0mxMA">
              <span class="recipecard_ratingCaption__CDw5D">5138 ratings with an average rating of 4.5 out of 5 stars</span>
              <span class="recipecard_stars__4hc6Q"><svg class="recipecard_star__ChYwL"></svg></span>
              <p class="pantry--ui-sm recipecard_ratingLabel__CqO_g">5,138</p>
            </div>
            <p class="pantry--ui-sm recipecard_cookTime__jBWS9">30 minutes</p>
          </section>
        </a>
        <a class="kickerlabel_kicker__k" href="/tag/easy">Easy</a>
      </article>
    </div>
  </li>
  <li>
    <div class="recipecard_recipeCard__yTYhK">
      <article>
        <a href="/recipes/456-soup">
          <section>
            <h3>Fallback Soup</h3>
            <div class="recipecard_recipeCardRating__0mxMA"><p class="pantry--ui-sm recipecard_ratingLabel__CqO_g">12</p></div>
          </section>
        </a>
      </article>
    </div>
  </li>
</ul>`;

const seriousEatsHtml = `
<div id="mntl-search-results__list_1-0" class="comp mntl-search-results__list">
  ${seriousEatsCard("Best Tacos &#8211; Ever", "best-tacos-recipe-123")}
</div>
<aside>${seriousEatsCard("Newsletter promo", "newsletter")}</aside>`;

const mollyBazHtml = `
<div class="pp-content-post-grid">
  <div class="pp-content-post pp-content-grid-post post-5118 category-noods entry">
    <div class="pp-content-grid-post-image">
      <a href='https://mollybaz.com/spaghetti-os/?swpmtx=abc&swpmtxnonce=def'>
        <img src="https://mollybaz.com/wp-content/uploads/spaghetti-os-scaled.jpg"
          srcset="https://mollybaz.com/wp-content/uploads/spaghetti-os-scaled.jpg 2560w, https://mollybaz.com/wp-content/uploads/spaghetti-os-768x945.jpg 768w, https://mollybaz.com/wp-content/uploads/spaghetti-os-650x800.jpg 650w, https://mollybaz.com/wp-content/uploads/spaghetti-os-150x150.jpg 150w" />
      </a>
    </div>
    <div class="pp-content-grid-post-text">
      <h3 class="pp-content-grid-post-title"><a href='https://mollybaz.com/spaghetti-os/?swpmtx=abc&swpmtxnonce=def'>End of Summer <mark class="searchwp-highlight">Spaghetti</mark>-O&#8217;s</a></h3>
    </div>
  </div>
  <div class="pp-content-post pp-content-grid-post post-5119 entry">
    <div class="pp-content-grid-post-image">
      <a href='https://mollybaz.com/tuna/'><img src="https://mollybaz.com/wp-content/uploads/tuna.jpg" /></a>
    </div>
    <h3 class="pp-content-grid-post-title"><a href='https://mollybaz.com/tuna/'>Tuna Surprise</a></h3>
  </div>
</div>`;

const noMeta = {
  rating: undefined,
  ratingCount: undefined,
  time: undefined,
  tags: undefined,
};

describe("searchSource", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("extracts NYT Cooking cards, without mistaking the ratings count for the cook time", async () => {
    stubFetch({ "cooking.nytimes.com": nytHtml });

    const { recipes, failed } = await searchSource(
      "newYorkTimesCooking",
      "pasta"
    );

    expect(failed).toBe(false);
    expect(recipes).toEqual([
      {
        title: "Pasta & Peas",
        img: "https://static01.nyt.com/pasta.jpg",
        link: "https://cooking.nytimes.com/recipes/123-pasta",
        author: "Melissa Clark",
        description: undefined,
        meta: {
          rating: 4.5,
          ratingCount: 5138,
          time: "30 minutes",
          tags: "Easy",
        },
      },
      {
        title: "Fallback Soup",
        img: undefined,
        link: "https://cooking.nytimes.com/recipes/456-soup",
        author: undefined,
        description: undefined,
        meta: { ...noMeta, ratingCount: 12 },
      },
    ]);
  });

  it("extracts Serious Eats result cards and strips the byline prefix", async () => {
    stubFetch({ "www.seriouseats.com": seriousEatsHtml });

    const { recipes } = await searchSource("seriousEats", "tacos");

    expect(recipes).toEqual([
      {
        title: "Best Tacos – Ever",
        img: "https://www.seriouseats.com/thmb/best-tacos-recipe-123.jpg",
        link: "https://www.seriouseats.com/best-tacos-recipe-123",
        author: "Kenji López-Alt",
        description: undefined,
        meta: noMeta,
      },
    ]);
  });

  it("reports a site that refuses the request as failed, not as having no matches", async () => {
    stubFetch({
      "www.seriouseats.com": new Response("blocked", { status: 403 }),
    });

    expect(await searchSource("seriousEats", "tacos")).toEqual({
      recipes: [],
      failed: true,
    });
  });

  it("reports a network error as failed", async () => {
    stubFetch({
      "cooking.nytimes.com": () => {
        throw new TypeError("fetch failed");
      },
    });

    expect(await searchSource("newYorkTimesCooking", "tacos")).toEqual({
      recipes: [],
      failed: true,
    });
  });

  it("reports a page without result cards as no matches", async () => {
    stubFetch({ "cooking.nytimes.com": "<html><body>Nothing</body></html>" });

    expect(await searchSource("newYorkTimesCooking", "zzz")).toEqual({
      recipes: [],
      failed: false,
    });
  });

  it("extracts Molly Baz cards without search highlighting, tracking params or full-size images", async () => {
    const fetchMock = stubFetch({ "mollybaz.com": mollyBazHtml });

    const { recipes } = await searchSource("mollyBaz", "mac & cheese");

    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "https://mollybaz.com/?s=mac%20%26%20cheese"
    );
    expect(recipes).toEqual([
      {
        title: "End of Summer Spaghetti-O’s",
        img: "https://mollybaz.com/wp-content/uploads/spaghetti-os-650x800.jpg",
        link: "https://mollybaz.com/spaghetti-os/",
        author: undefined,
        description: undefined,
        meta: noMeta,
      },
      {
        title: "Tuna Surprise",
        img: "https://mollybaz.com/wp-content/uploads/tuna.jpg",
        link: "https://mollybaz.com/tuna/",
        author: undefined,
        description: undefined,
        meta: noMeta,
      },
    ]);
  });

  it("searches every page of the Ottolenghi catalogue, ranking title matches first", async () => {
    stubFetch({
      [ottolenghiHost]: ottolenghiCatalogue([
        [
          ottolenghiRecipe("Miso trofie", {
            main_ingredient: ["Pasta"],
            meal: ["Mains"],
          }),
          ottolenghiRecipe("Charred green beans", { meal: ["Sides"] }),
          ottolenghiRecipe("Unpublished pasta", {}, null),
        ],
        [
          ottolenghiRecipe("Cheat’s XO pasta", {
            main_ingredient: ["Pasta"],
            collection: ["Easy", "Dairy free"],
          }),
        ],
      ]),
    });

    const { recipes } = await searchSource("ottolenghi", "Pasta");

    expect(recipes).toEqual([
      {
        title: "Cheat’s XO pasta",
        description: "Cheat’s XO pasta description",
        img: "https://cdn.shopify.com/Cheat’s XO pasta.jpg",
        link: "https://ottolenghi.co.uk/pages/recipes/cheat-s-xo-pasta",
        meta: { tags: "Pasta, Easy, Dairy free" },
      },
      {
        title: "Miso trofie",
        description: "Miso trofie description",
        img: "https://cdn.shopify.com/Miso trofie.jpg",
        link: "https://ottolenghi.co.uk/pages/recipes/miso-trofie",
        meta: { tags: "Pasta, Mains" },
      },
    ]);
  });

  it("requires every search term to appear in an Ottolenghi recipe's title or tags", async () => {
    stubFetch({
      [ottolenghiHost]: ottolenghiCatalogue([
        [
          ottolenghiRecipe("Chicken orzo", { main_ingredient: ["Pasta"] }),
          ottolenghiRecipe("Chicken traybake", {
            main_ingredient: ["Chicken"],
          }),
        ],
      ]),
    });

    const { recipes } = await searchSource("ottolenghi", "chicken pasta");

    expect(recipes.map((recipe) => recipe.title)).toEqual(["Chicken orzo"]);
  });

  it("reports the Ottolenghi storefront failing as failed", async () => {
    stubFetch({
      [ottolenghiHost]: new Response("throttled", { status: 429 }),
    });

    expect(await searchSource("ottolenghi", "spaghetti")).toEqual({
      recipes: [],
      failed: true,
    });
  });
});
