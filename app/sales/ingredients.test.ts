import { describe, expect, it } from "vitest";

import { ingredientsIn, saleIngredients } from "./ingredients";

describe("ingredientsIn", () => {
  it("finds singular and plural label wordings", () => {
    expect(ingredientsIn("Organic Honeycrisp™ Apple, 3 lb.")).toEqual(["apples"]);
    expect(ingredientsIn("Jumbo Blueberries, 9.8 oz")).toEqual(["blueberries"]);
    expect(ingredientsIn("Winter Squashes")).toEqual(["winter squash"]);
  });

  it("prefers the longest wording at each place in the name", () => {
    expect(ingredientsIn("Orange or Red Sweet Potatoes")).toEqual(["sweet potatoes"]);
    expect(ingredientsIn("Wellshire Uncured Turkey Bacon")).toEqual(["bacon"]);
    expect(ingredientsIn("Niman Ranch Bacon, Sausage, Ham Steak or Pulled Pork")).toEqual([
      "bacon",
      "sausage",
      "ham",
      "pork",
    ]);
  });

  it("reads label names for an ingredient", () => {
    expect(ingredientsIn("Mitica Parmigiano Reggiano")).toEqual(["parmesan"]);
    expect(ingredientsIn("Boneless Pork Butt Shoulder Roast")).toEqual(["pork shoulder"]);
    expect(ingredientsIn("Jalapeño Peppers")).toEqual(["jalapeños"]);
  });

  it("ignores prepared foods and drinks named after an ingredient", () => {
    expect(ingredientsIn("Rao's Pasta Sauces, 24 oz")).toEqual([]);
    expect(ingredientsIn("Apple Brown Butter Cookies, 4 pk")).toEqual([]);
    expect(ingredientsIn("Made with Organic Grapes Spumante Rosé Brut, 750 ml")).toEqual([]);
  });

  it("ignores wordings that contain an ingredient without being it", () => {
    expect(ingredientsIn("Chosen Foods Avocado Oil")).toEqual([]);
    expect(ingredientsIn("Pineapple Chunks")).toEqual(["pineapple"]);
  });
});

describe("saleIngredients", () => {
  it("ranks ingredients more stores discount first, then the ads' earliest", () => {
    const ingredients = saleIngredients([
      {
        store: "wholeFoods",
        items: [
          { name: "Sockeye Salmon Fillets" },
          { name: "Honeycrisp Apples", price: "$3.32/lb" },
          { name: "Granny Smith Apples" },
        ],
      },
      {
        store: "sprouts",
        items: [{ name: "Large Eggs" }, { name: "Lucy Rose Apples" }],
      },
    ]);

    expect(ingredients).toEqual([
      {
        term: "apples",
        deals: [
          { store: "wholeFoods", item: { name: "Honeycrisp Apples", price: "$3.32/lb" } },
          { store: "sprouts", item: { name: "Lucy Rose Apples" } },
        ],
      },
      { term: "salmon", deals: [{ store: "wholeFoods", item: { name: "Sockeye Salmon Fillets" } }] },
      { term: "eggs", deals: [{ store: "sprouts", item: { name: "Large Eggs" } }] },
    ]);
  });
});
