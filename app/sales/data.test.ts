import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { stubFetch } from "@/testing";
import type { FlippItem, WholeFoodsLocation, WholeFoodsPromotion } from "@/types";

import {
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

const unionStation: WholeFoodsLocation = {
  storeCode: "10626",
  locationName: "Union Station",
  address: { addressLines: ["1701 Wewatta St"], city: "Denver" },
};

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
    ).toEqual({ name: "Pringles", price: "$1.49/ea with card", note: "was $2.49" });
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
  it("reads the sale price, with the Prime and regular prices behind it", () => {
    expect(wholeFoodsSaleItem(promotion("Honeycrisp Apples"))).toEqual({
      name: "Organic Honeycrisp Apples",
      price: "$3.32/lb",
      note: "$2.99/lb with Prime · regular $3.99/lb",
    });
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

  it("falls back to the Prime price when only members get a deal", () => {
    expect(
      wholeFoodsSaleItem(
        promotion("Chicken Wings", { salePrice: "", primePrice: "Buy 2, Get 1 Free" })
      ).price
    ).toBe("Buy 2, Get 1 Free with Prime");
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

  it("reads the sales flyer of the Whole Foods nearest the zip code", async () => {
    const fetchMock = stubFetch({
      "www.wholefoodsmarket.com": (_, url) =>
        url.pathname === "/aplf/list"
          ? storeFinderPage([
              unionStation,
              { ...unionStation, storeCode: "10746", locationName: "Capitol Hill" },
            ])
          : salesFlyerPage([
              promotion("Honeycrisp Apples"),
              promotion("Parmigiano Reggiano", { endDate: "2026-10-25T05:00:00Z" }),
              promotion("Honeycrisp Apples"),
            ]),
    });

    const result = await getStoreSales("wholeFoods", "80202");

    const flyerUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(flyerUrl.searchParams.get("store-id")).toBe("10626");
    expect(result).toEqual({
      status: "found",
      sales: {
        url: "https://www.wholefoodsmarket.com/sales-flyer?store-id=10626",
        location: "Union Station, 1701 Wewatta St",
        through: "2026-10-27",
        items: [
          expect.objectContaining({ name: "Organic Honeycrisp Apples" }),
          expect.objectContaining({ name: "Organic Parmigiano Reggiano" }),
        ],
      },
    });
  });

  it("has no Whole Foods sales where the store finder lists no store", async () => {
    stubFetch({ "www.wholefoodsmarket.com": storeFinderPage([]) });

    expect(await getStoreSales("wholeFoods", "99701")).toEqual({ status: "none" });
  });

  it("reports Whole Foods as failed when the flyer page lacks its data", async () => {
    stubFetch({
      "www.wholefoodsmarket.com": (_, url) =>
        url.pathname === "/aplf/list" ? storeFinderPage([unionStation]) : "<html></html>",
    });

    expect(await getStoreSales("wholeFoods", "80203")).toEqual({ status: "failed" });
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

    const result = await getStoreSales("kingSoopers", "80202");

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

  it("has no Flipp sales where the store has no weekly ad", async () => {
    stubFetch({
      "backflipp.wishabi.com": JSON.stringify({
        items: [flippItem("Organic Strawberries", { merchant_name: "Safeway" })],
      }),
    });

    expect(await getStoreSales("sprouts", "94301")).toEqual({ status: "none" });
  });

  it("reports Flipp as failed when it refuses the request", async () => {
    stubFetch({ "backflipp.wishabi.com": new Response("", { status: 503 }) });

    expect(await getStoreSales("sprouts", "80204")).toEqual({ status: "failed" });
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

    const ingredients = await ingredientsOnSale("80205");

    expect(ingredients.map(({ term, deals }) => [term, deals.map(({ store }) => store)])).toEqual([
      ["apples", ["kingSoopers", "sprouts"]],
      ["bacon", ["kingSoopers"]],
    ]);
  });
});
