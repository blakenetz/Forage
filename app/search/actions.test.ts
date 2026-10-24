import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OttolenghiRecipe } from "@/types";
import { fetchRecipeData } from "./actions";

const nytHtml = `
<ul>
  <li>
    <div class="recipecard_card__abc">
      <a class="link_link__x" href="/recipes/123-pasta">
        <img class="cardimage_image__y" src="https://static01.nyt.com/pasta.jpg" />
        <h3 class="pantry--ui-strong title">Pasta &amp; Peas</h3>
      </a>
      <p class="pantry--ui-sm recipecard_byline__z">Melissa Clark</p>
      <p class="pantry--ui-xs recipecard_cookTime__t">30 minutes</p>
      <span class="recipecard_stars__s">
        <svg class="star filledStar"></svg>
        <svg class="star filledStar"></svg>
        <svg class="star filledStar"></svg>
        <svg class="star emptyStar"></svg>
      </span>
      <div class="recipecard_recipeCardRating__r"><p class="pantry--ui-xs count">120</p></div>
      <a class="kickerlabel_kicker__k" href="/tag/easy">Easy</a>
    </div>
  </li>
  <li>
    <div class="recipecard_card__abc">
      <article>
        <a href="/recipes/456-soup">
          <figure><img src="https://static01.nyt.com/soup.jpg" /></figure>
          <h3>Fallback Soup</h3>
        </a>
      </article>
    </div>
  </li>
</ul>`;

const seriousEatsHtml = `
<ul>
  <li class="card-list__item">
    <a href="https://www.seriouseats.com/best-tacos">
      <div class="card__media"><img data-src="https://www.seriouseats.com/tacos.jpg" /></div>
      <span class="card__title"><span class="card__underline">Best Tacos &#8211; Ever</span></span>
      <div class="card__author-name" data-byline-author="By Kenji López-Alt"></div>
    </a>
  </li>
</ul>`;

function preloadedStateHtml(items: unknown[]) {
  const state = { transformed: { search: { items } } };
  return `
<html><body>
  <script type="text/javascript" defer>window.__PRELOADED_STATE__ = {"ignored": true};</script>
  <script type="text/javascript">window.__PRELOADED_STATE__ = ${JSON.stringify(state)};</script>
</body></html>`;
}

const epicuriousItem = {
  id: "1",
  contentType: "recipe",
  dangerousHed: "Mac &amp; Cheese",
  dangerousDek: "Creamy &quot;baked&quot; classic",
  url: "/recipes/food/views/mac-and-cheese",
  rating: 4.5,
  reviewsCount: 87,
  image: {
    sources: {
      sm: { aspectRatio: "1:1", url: "https://assets.epicurious.com/sm.jpg" },
      md: { aspectRatio: "1:1", url: "https://assets.epicurious.com/md.jpg" },
      lg: { aspectRatio: "1:1", url: "https://assets.epicurious.com/lg.jpg" },
      xl: { aspectRatio: "1:1", url: "https://assets.epicurious.com/xl.jpg" },
    },
  },
  imageLabels: ["comfort food", "cheese"],
  contributors: {
    author: {
      items: [
        {
          name: "Anna Stockwell",
          dangerousBio: "",
          dangerousTitle: "",
          url: "",
        },
        { name: "Joe Sevier", dangerousBio: "", dangerousTitle: "", url: "" },
      ],
    },
  },
};

const mollyBazHtml = `
<div class="pp-content-post-grid">
  <div class="pp-content-post pp-content-grid-post post-5118 category-noods entry">
    <div class="pp-content-grid-post-image">
      <a href='https://mollybaz.com/spaghetti-os/?swpmtx=abc&swpmtxnonce=def'>
        <img src="https://mollybaz.com/wp-content/uploads/spaghetti-os.jpg" class="pp-post-img" />
      </a>
    </div>
    <div class="pp-content-grid-post-text">
      <h3 class="pp-content-grid-post-title"><a href='https://mollybaz.com/spaghetti-os/?swpmtx=abc&swpmtxnonce=def'>End of Summer <mark class="searchwp-highlight">Spaghetti</mark>-O&#8217;s</a></h3>
    </div>
  </div>
</div>`;

const ottolenghiHost = "ottolenghi-group.myshopify.com";

function ottolenghiRecipe(
  title: string,
  tags: { main_ingredient?: string[]; meal?: string[]; collection?: string[] },
  onlineStoreUrl:
    | string
    | null = `https://ottolenghi.co.uk/pages/recipes/${title.toLowerCase().replace(/\W+/g, "-")}`
): OttolenghiRecipe {
  const list = (values?: string[]) =>
    values ? { value: JSON.stringify(values) } : null;
  return {
    onlineStoreUrl,
    title: { value: title },
    description: { value: `${title} description` },
    main_ingredient: list(tags.main_ingredient),
    meal: list(tags.meal),
    collection: list(tags.collection),
    images: {
      references: {
        nodes: [{ image: { url: `https://cdn.shopify.com/${title}.jpg` } }],
      },
    },
  };
}

/** Serves the Storefront catalogue in pages, following the request's cursor */
function ottolenghiCatalogue(pages: OttolenghiRecipe[][]) {
  return (init?: RequestInit) => {
    const { variables } = JSON.parse(String(init?.body));
    const index = variables.cursor ? Number(variables.cursor) : 0;
    const hasNextPage = index + 1 < pages.length;
    return JSON.stringify({
      data: {
        metaobjects: {
          nodes: pages[index],
          pageInfo: {
            hasNextPage,
            endCursor: hasNextPage ? String(index + 1) : null,
          },
        },
      },
    });
  };
}

type StubResponse = string | Response | ((init?: RequestInit) => string);

/** Hosts without a stub get an empty page, or an empty Ottolenghi catalogue */
function stubFetch(responses: Record<string, StubResponse> = {}) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(input.toString());
    const response =
      responses[url.hostname] ??
      (url.hostname === ottolenghiHost ? ottolenghiCatalogue([[]]) : "");
    if (response instanceof Response) return response;
    return new Response(
      typeof response === "function" ? response(init) : response
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchRecipeData", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("queries every source with the search term", async () => {
    const fetchMock = stubFetch();

    await fetchRecipeData("tacos");

    const urls = fetchMock.mock.calls.map(([input]) => input.toString());
    expect(urls).toEqual([
      "https://cooking.nytimes.com/search?q=tacos",
      "https://www.epicurious.com/search?q=tacos&content=recipe",
      "https://www.bonappetit.com/search?q=tacos&content=recipe",
      "https://www.seriouseats.com/search?q=tacos",
      `https://${ottolenghiHost}/api/2024-04/graphql.json`,
      "https://mollybaz.com/?s=tacos",
    ]);
  });

  it("extracts NYT Cooking cards, falling back to secondary selectors", async () => {
    stubFetch({ "cooking.nytimes.com": nytHtml });

    const { newYorkTimesCooking } = await fetchRecipeData("pasta");

    expect(newYorkTimesCooking).toHaveLength(2);
    expect(newYorkTimesCooking[0]).toEqual({
      title: "Pasta & Peas",
      img: "https://static01.nyt.com/pasta.jpg",
      link: "https://cooking.nytimes.com/recipes/123-pasta",
      author: "Melissa Clark",
      description: undefined,
      meta: { rating: 3, ratingCount: 120, time: "30 minutes", tags: "Easy" },
    });
    expect(newYorkTimesCooking[1]).toMatchObject({
      title: "Fallback Soup",
      img: "https://static01.nyt.com/soup.jpg",
      link: "https://cooking.nytimes.com/recipes/456-soup",
    });
  });

  it("extracts Serious Eats cards and strips the byline prefix", async () => {
    stubFetch({ "www.seriouseats.com": seriousEatsHtml });

    const { seriousEats } = await fetchRecipeData("tacos");

    expect(seriousEats).toEqual([
      {
        title: "Best Tacos – Ever",
        img: "https://www.seriouseats.com/tacos.jpg",
        link: "https://www.seriouseats.com/best-tacos",
        author: "Kenji López-Alt",
        description: undefined,
        meta: {
          rating: undefined,
          ratingCount: undefined,
          time: undefined,
          tags: undefined,
        },
      },
    ]);
  });

  it("reads Epicurious and Bon Appétit results from the non-deferred preloaded state", async () => {
    const html = preloadedStateHtml([epicuriousItem]);
    stubFetch({
      "www.bonappetit.com": html,
      "www.epicurious.com": html,
    });

    const { epicurious, bonAppetit } = await fetchRecipeData("mac");

    expect(epicurious).toEqual([
      {
        title: "Mac & Cheese",
        description: 'Creamy "baked" classic',
        author: "Anna Stockwell, Joe Sevier",
        img: "https://assets.epicurious.com/md.jpg",
        link: "https://epicurious.com/recipes/food/views/mac-and-cheese",
        meta: { rating: 4.5, ratingCount: 87, tags: "Comfort food, Cheese" },
      },
    ]);
    expect(bonAppetit[0].link).toBe(
      "https://bonappetit.com/recipes/food/views/mac-and-cheese"
    );
  });

  it("returns no results for a source whose page lacks preloaded state", async () => {
    stubFetch({
      "www.bonappetit.com": "<html><body>blocked</body></html>",
      "www.epicurious.com": preloadedStateHtml([epicuriousItem]),
    });

    const { bonAppetit, epicurious } = await fetchRecipeData("mac");

    expect(bonAppetit).toEqual([]);
    expect(epicurious).toHaveLength(1);
  });

  it("extracts Molly Baz cards without search highlighting or tracking params", async () => {
    stubFetch({ "mollybaz.com": mollyBazHtml });

    const { mollyBaz } = await fetchRecipeData("spaghetti");

    expect(mollyBaz).toEqual([
      {
        title: "End of Summer Spaghetti-O’s",
        img: "https://mollybaz.com/wp-content/uploads/spaghetti-os.jpg",
        link: "https://mollybaz.com/spaghetti-os/",
        author: undefined,
        description: undefined,
        meta: {
          rating: undefined,
          ratingCount: undefined,
          time: undefined,
          tags: undefined,
        },
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

    const { ottolenghi } = await fetchRecipeData("Pasta");

    expect(ottolenghi).toEqual([
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

    const { ottolenghi } = await fetchRecipeData("chicken pasta");

    expect(ottolenghi.map((r) => r.title)).toEqual(["Chicken orzo"]);
  });

  it("returns no Ottolenghi results when the storefront fails, without affecting other sources", async () => {
    stubFetch({
      [ottolenghiHost]: new Response("throttled", { status: 429 }),
      "mollybaz.com": mollyBazHtml,
    });

    const { ottolenghi, mollyBaz } = await fetchRecipeData("spaghetti");

    expect(ottolenghi).toEqual([]);
    expect(mollyBaz).toHaveLength(1);
  });
});
