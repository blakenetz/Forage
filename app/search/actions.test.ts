import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
        { name: "Anna Stockwell", dangerousBio: "", dangerousTitle: "", url: "" },
        { name: "Joe Sevier", dangerousBio: "", dangerousTitle: "", url: "" },
      ],
    },
  },
};

function stubFetch(pages: Record<string, string>) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(input.toString());
    const body = pages[url.hostname];
    if (body === undefined) throw new Error(`Unexpected fetch: ${url}`);
    return new Response(body);
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
    const fetchMock = stubFetch({
      "cooking.nytimes.com": "",
      "www.seriouseats.com": "",
      "www.bonappetit.com": "",
      "www.epicurious.com": "",
    });

    await fetchRecipeData("tacos");

    const urls = fetchMock.mock.calls.map(([input]) => input.toString());
    expect(urls).toEqual([
      "https://cooking.nytimes.com/search?q=tacos",
      "https://www.epicurious.com/search?q=tacos&content=recipe",
      "https://www.bonappetit.com/search?q=tacos&content=recipe",
      "https://www.seriouseats.com/search?q=tacos",
    ]);
  });

  it("extracts NYT Cooking cards, falling back to secondary selectors", async () => {
    stubFetch({
      "cooking.nytimes.com": nytHtml,
      "www.seriouseats.com": "",
      "www.bonappetit.com": "",
      "www.epicurious.com": "",
    });

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
    stubFetch({
      "cooking.nytimes.com": "",
      "www.seriouseats.com": seriousEatsHtml,
      "www.bonappetit.com": "",
      "www.epicurious.com": "",
    });

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
      "cooking.nytimes.com": "",
      "www.seriouseats.com": "",
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
      "cooking.nytimes.com": "",
      "www.seriouseats.com": "",
      "www.bonappetit.com": "<html><body>blocked</body></html>",
      "www.epicurious.com": preloadedStateHtml([epicuriousItem]),
    });

    const { bonAppetit, epicurious } = await fetchRecipeData("mac");

    expect(bonAppetit).toEqual([]);
    expect(epicurious).toHaveLength(1);
  });
});
