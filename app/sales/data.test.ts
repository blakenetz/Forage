import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { stubFetch } from "@/testing";
import type { FlippItem, WholeFoodsLocation, WholeFoodsPromotion } from "@/types";

import {
  dealDiscount,
  flippSaleItem,
  getStoreSales,
  ingredientsOnSale,
  wholeFoodsSaleItem,
} from "./data";

function flippItem(name: string, overrides: Partial<FlippItem> = {}): FlippItem {
  return {
    name,
    merchant_name: "King Soopers",
    _L1: "Food, Beverages & Tobacco",
    pre_price_text: null,
    current_price: 2.99,
    post_price_text: null,
    original_price: null,
    sale_story: null,
    valid_to: "2026-10-28T03:59:59+00:00",
    ...overrides,
  };
}

function promotion(
  productName: string,
  overrides: Partial<WholeFoodsPromotion> = {}
): WholeFoodsPromotion {
  return {
    originBrandName: "Organic",
    productName,
    regularPrice: "$3.99/lb",
    salePrice: "$3.32/lb",
    primePrice: "$2.99/lb",
    endDate: "2026-10-27T05:00:00Z",
    ...overrides,
  };
}

function storeFinderPage(locations: WholeFoodsLocation[]) {
  const state = JSON.stringify({ isDesktop: false, locations });
  return `<html><body><script type="a-state" data-a-state="{&quot;key&quot;:&quot;list-page-state&quot;}">${state}</script></body></html>`;
}

function salesFlyerPage(promotions: WholeFoodsPromotion[]) {
  const data = JSON.stringify({ props: { pageProps: { promotions } } });
  return `<html><body><script id="__NEXT_DATA__" type="application/json">${data}</script></body></html>`;
}

// the stores around 80204, as far from the zip code's middle as the store finder says
const unionStation: WholeFoodsLocation = {
  storeCode: "10626",
  locationName: "Union Station",
  address: { addressLines: ["1701 Wewatta St"], city: "Denver" },
  geocode: { latitude: 39.7542, longitude: -105.0014 },
  distance: 1.66,
};
const capitolHill: WholeFoodsLocation = {
  storeCode: "10746",
  locationName: "Capitol Hill Denver",
  address: { addressLines: ["900 East 11th Avenue"], city: "Denver" },
  geocode: { latitude: 39.7334, longitude: -104.9776 },
  distance: 2.36,
};
const belmar: WholeFoodsLocation = {
  storeCode: "10218",
  locationName: "Belmar",
  address: { addressLines: ["444 S Wadsworth Blvd"], city: "Lakewood" },
  geocode: { latitude: 39.7083, longitude: -105.0815 },
  distance: 3.7,
};

/** Answers the store finder with `around`, and any flyer with apples */
function stubWholeFoods(around: WholeFoodsLocation[]) {
  return stubFetch({
    "www.wholefoodsmarket.com": (_, url) =>
      url.pathname === "/aplf/list"
        ? storeFinderPage(around)
        : salesFlyerPage([promotion("Honeycrisp Apples")]),
  });
}

const flyerStore = (fetchMock: Mock<typeof fetch>) =>
  new URL(String(fetchMock.mock.calls[1][0])).searchParams.get("store-id");

describe("flippSaleItem", () => {
  it("joins a multi-buy price back together", () => {
    expect(
      flippSaleItem(
        flippItem("Organic Large Hass Avocados", {
          pre_price_text: "2 FOR",
          current_price: 4,
        })
      )
    ).toEqual({ name: "Organic Large Hass Avocados", price: "2 for $4" });
    expect(
      flippSaleItem(
        flippItem("Kroger Beef Shaved Steak", {
          pre_price_text: "2/",
          current_price: 10,
          post_price_text: "With Card",
        })
      ).price
    ).toBe("2/$10 with card");
  });

  it("drops footnote marks from the unit and notes the old price", () => {
    expect(
      flippSaleItem(
        flippItem("Pringles", {
          current_price: 1.49,
          post_price_text: "/EA** With Card",
          original_price: 2.49,
        })
      )
    ).toEqual({
      name: "Pringles",
      price: "$1.49/ea with card",
      note: "40% off · was $2.49",
      discount: expect.closeTo(0.4, 2),
    });
  });

  it("reads a multi-buy's discount against the old price of one", () => {
    expect(
      flippSaleItem(
        flippItem("Kroger Beef Shaved Steak", {
          pre_price_text: "2/",
          current_price: 10,
          original_price: 6.99,
        })
      ).discount
    ).toBeCloseTo(0.285, 3);
  });

  it("uses the deal itself when there is no price, without the fine print", () => {
    expect(
      flippSaleItem(
        flippItem("Organic Strawberries", {
          current_price: null,
          sale_story:
            "BUY ONE, GET ONE 50% OFF regular retail of equal or lesser value",
        })
      ).price
    ).toBe("Buy one, get one 50% off");
  });
});

describe("wholeFoodsSaleItem", () => {
  it("leads with the Prime price, with the price without Prime and the regular price beneath", () => {
    expect(wholeFoodsSaleItem(promotion("Honeycrisp Apples"))).toEqual({
      name: "Organic Honeycrisp Apples",
      price: "$2.99/lb",
      note: "25% off · $3.32/lb without Prime · regular $3.99/lb",
      discount: expect.closeTo(0.25, 2),
    });
  });

  it("works out the share off from the Prime and regular prices, and says it", () => {
    expect(
      wholeFoodsSaleItem(
        promotion("Red, Bosc or Bartlett Pears", {
          regularPrice: "$3.29/lb",
          salePrice: "$2.99/lb",
          primePrice: "$2.69/lb",
        })
      )
    ).toEqual({
      name: "Organic Red, Bosc or Bartlett Pears",
      price: "$2.69/lb",
      note: "18% off · $2.99/lb without Prime · regular $3.29/lb",
      discount: expect.closeTo(0.182, 3),
    });
  });

  it("doesn't repeat a share off the price already states", () => {
    expect(
      wholeFoodsSaleItem(
        promotion("Pasta Sauces", {
          regularPrice: "$8.29",
          salePrice: "22% off",
          primePrice: "30% off",
        })
      ).note
    ).toBe("22% off without Prime · regular $8.29");
  });

  it("skips a Prime footnote that is not a price", () => {
    expect(
      wholeFoodsSaleItem(
        promotion("Spumante Rosé Brut", {
          originBrandName: "Pizzolato",
          salePrice: "$1 off",
          primePrice: "*Excluded from the extra 10% off",
          regularPrice: "Regular prices vary",
        })
      )
    ).toEqual({
      name: "Pizzolato Spumante Rosé Brut",
      price: "$1 off",
      note: "regular prices vary",
    });
  });

  it("says so when only Prime members get a deal", () => {
    expect(
      wholeFoodsSaleItem(
        promotion("Chicken Wings", { salePrice: "", primePrice: "Buy 2, Get 1 Free" })
      )
    ).toEqual({
      name: "Organic Chicken Wings",
      price: "Buy 2, Get 1 Free",
      note: "Prime members only · regular $3.99/lb",
      discount: 1 / 3,
    });
  });

  it("reads a percentage, a multi-buy or an amount off against a single regular price", () => {
    const discount = (overrides: Partial<WholeFoodsPromotion>) =>
      wholeFoodsSaleItem(promotion("Yogurt", overrides)).discount;

    expect(discount({ primePrice: "30% off" })).toBe(0.3);
    expect(discount({ primePrice: "2 for $4", regularPrice: "$2.59" })).toBeCloseTo(0.228, 3);
    expect(discount({ primePrice: "$1 off", regularPrice: "$10.00" })).toBeCloseTo(0.1, 3);
    // a range of regular prices says nothing about this one
    expect(discount({ primePrice: "$5.99", regularPrice: "$5.99 to $9.99" })).toBeUndefined();
  });
});

describe("dealDiscount", () => {
  it("counts buy-one-get-one-free deals as half off", () => {
    expect(dealDiscount("Buy one, get one free")).toBe(0.5);
    expect(dealDiscount("BUY 3, GET 3 FREE of equal or lesser value with card")).toBe(0.5);
  });

  it("spreads a multi-buy's saving over everything bought", () => {
    expect(dealDiscount("Buy one, get one 50% off")).toBe(0.25);
    expect(dealDiscount("BUY 2, GET 1 of equal or lesser value FREE with card")).toBe(1 / 3);
  });

  it("reads a percentage off or saved", () => {
    expect(dealDiscount("25% OFF*")).toBe(0.25);
    expect(dealDiscount("SAVE 50% with card")).toBe(0.5);
  });

  it("has no discount for a deal without a share off", () => {
    expect(dealDiscount("SAVE $5 AN EXTRA When you spend $15 or more")).toBeUndefined();
  });
});

describe("getStoreSales", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads the sales flyer of the Whole Foods nearest the zip code's middle", async () => {
    const fetchMock = stubFetch({
      "www.wholefoodsmarket.com": (_, url) =>
        url.pathname === "/aplf/list"
          ? storeFinderPage([unionStation, capitolHill])
          : salesFlyerPage([
              promotion("Honeycrisp Apples"),
              promotion("Parmigiano Reggiano", { endDate: "2026-10-25T05:00:00Z" }),
              promotion("Honeycrisp Apples"),
            ]),
    });

    const result = await getStoreSales("wholeFoods", { zip: "80202" });

    expect(flyerStore(fetchMock)).toBe("10626");
    expect(result).toEqual({
      status: "found",
      sales: {
        url: "https://www.wholefoodsmarket.com/sales-flyer?store-id=10626",
        location: "Union Station, 1701 Wewatta St",
        pricing: "Prime prices",
        through: "2026-10-27",
        items: [
          expect.objectContaining({ name: "Organic Honeycrisp Apples" }),
          expect.objectContaining({ name: "Organic Parmigiano Reggiano" }),
        ],
        choices: [
          { id: "10626", name: "Union Station, 1701 Wewatta St", miles: 1.66 },
          { id: "10746", name: "Capitol Hill Denver, 900 East 11th Avenue", miles: 2.36 },
        ],
        chosen: "10626",
      },
    });
  });

  it("picks the Whole Foods nearest the visitor's location over the zip code's middle", async () => {
    const fetchMock = stubWholeFoods([unionStation, capitolHill, belmar]);

    // near Alameda and Sheridan, in the far west of 80204
    const result = await getStoreSales("wholeFoods", {
      zip: "80204",
      near: "39.724,-105.045",
    });

    expect(flyerStore(fetchMock)).toBe("10218");
    const { choices } = result.status === "found" ? result.sales : {};
    expect(choices?.map(({ id }) => id)).toEqual(["10218", "10626", "10746"]);
    expect(choices?.[0].miles).toBeCloseTo(2.2, 1);
  });

  it("reads the store picked from the menu, over the nearest", async () => {
    const fetchMock = stubWholeFoods([unionStation, capitolHill, belmar]);

    await getStoreSales("wholeFoods", {
      zip: "80205",
      near: "39.724,-105.045",
      wholeFoodsStore: "10746",
    });

    expect(flyerStore(fetchMock)).toBe("10746");
  });

  it("ignores a picked store that isn't around the zip code", async () => {
    const fetchMock = stubWholeFoods([unionStation, capitolHill]);

    // Belmar was picked, then the visitor looked up another part of town
    await getStoreSales("wholeFoods", { zip: "80206", wholeFoodsStore: "10218" });

    expect(flyerStore(fetchMock)).toBe("10626");
  });

  it("has no Whole Foods sales where the store finder lists no store", async () => {
    stubFetch({ "www.wholefoodsmarket.com": storeFinderPage([]) });

    expect(await getStoreSales("wholeFoods", { zip: "99701" })).toEqual({ status: "none" });
  });

  it("reports Whole Foods as failed when the flyer page lacks its data", async () => {
    stubFetch({
      "www.wholefoodsmarket.com": (_, url) =>
        url.pathname === "/aplf/list" ? storeFinderPage([unionStation]) : "<html></html>",
    });

    expect(await getStoreSales("wholeFoods", { zip: "80203" })).toEqual({ status: "failed" });
  });

  it("keeps the store's groceries from Flipp, ending on the ad's local last day", async () => {
    const fetchMock = stubFetch({
      "backflipp.wishabi.com": JSON.stringify({
        items: [
          flippItem("Kroger Cage Free Eggs"),
          flippItem("Kroger Cage Free Eggs"),
          flippItem("Holiday Treat Bucket", { _L1: "Home & Garden" }),
          flippItem("Safeway Eggs", { merchant_name: "Safeway" }),
          flippItem("Oscar Mayer Bacon"),
        ],
      }),
    });

    const result = await getStoreSales("kingSoopers", { zip: "80202" });

    const searchUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(searchUrl.searchParams.get("postal_code")).toBe("80202");
    expect(searchUrl.searchParams.get("q")).toBe("King Soopers");
    expect(result).toEqual({
      status: "found",
      sales: {
        url: "https://www.kingsoopers.com/weeklyad",
        through: "2026-10-27",
        items: [
          { name: "Kroger Cage Free Eggs", price: "$2.99" },
          { name: "Oscar Mayer Bacon", price: "$2.99" },
        ],
      },
    });
  });

  it("lists the biggest discounts first, buy-one-get-one-free as half off", async () => {
    stubFetch({
      "backflipp.wishabi.com": JSON.stringify({
        items: [
          flippItem("Kroger Cage Free Eggs"),
          flippItem("Prego Pasta Sauce", { current_price: 1.49, original_price: 2.49 }),
          flippItem("Pepsi", { current_price: null, sale_story: "BUY 3, GET 3 FREE with card" }),
          flippItem("Heinz Gravy", { current_price: 1.99, original_price: 2.99 }),
          flippItem("Chex Mix", { current_price: null, sale_story: "BUY 1, GET 1 FREE" }),
        ],
      }),
    });

    const result = await getStoreSales("kingSoopers", { zip: "80207" });

    // deals that don't say how much they save keep their place, last
    expect(result.status === "found" && result.sales.items.map(({ name }) => name)).toEqual([
      "Pepsi",
      "Chex Mix",
      "Prego Pasta Sauce",
      "Heinz Gravy",
      "Kroger Cage Free Eggs",
    ]);
  });

  it("has no Flipp sales where the store has no weekly ad", async () => {
    stubFetch({
      "backflipp.wishabi.com": JSON.stringify({
        items: [flippItem("Organic Strawberries", { merchant_name: "Safeway" })],
      }),
    });

    expect(await getStoreSales("sprouts", { zip: "94301" })).toEqual({ status: "none" });
  });

  it("reports Flipp as failed when it refuses the request", async () => {
    stubFetch({ "backflipp.wishabi.com": new Response("", { status: 503 }) });

    expect(await getStoreSales("sprouts", { zip: "80204" })).toEqual({ status: "failed" });
  });
});

describe("ingredientsOnSale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("cooks from the stores that answered", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    stubFetch({
      "www.wholefoodsmarket.com": new Response("", { status: 500 }),
      "backflipp.wishabi.com": (_, url) =>
        JSON.stringify({
          items:
            url.searchParams.get("q") === "King Soopers"
              ? [flippItem("Kroger Gala Apples"), flippItem("Oscar Mayer Bacon")]
              : [flippItem("Organic Apples", { merchant_name: "Sprouts Farmers Market" })],
        }),
    });

    const ingredients = await ingredientsOnSale({ zip: "80205" });

    expect(ingredients.map(({ term, deals }) => [term, deals.map(({ store }) => store)])).toEqual([
      ["apples", ["kingSoopers", "sprouts"]],
      ["bacon", ["kingSoopers"]],
    ]);
  });
});
