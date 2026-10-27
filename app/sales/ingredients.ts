import type { Store } from "@/stores";

import type { SaleItem } from "./data";

/** How many sale ingredients the landing page offers as searches beside "In season now" */
export const featuredIngredients = 5;

/**
 * What a cook would search for, as written in the search box. A plain entry
 * also matches its singular ("apples" finds "Gala Apple"); an array lists
 * the label wordings (regular expressions over lower-case, unaccented,
 * punctuation-free names) that mean that ingredient.
 */
const vocabulary: (string | [string, ...string[]])[] = [
  // produce
  "apples",
  "pears",
  "blood oranges",
  // "orange" alone is usually a colour ("Orange or Red Sweet Potatoes")
  ["oranges", "oranges"],
  ["mandarins", "mandarins?", "cuties", "clementines?"],
  "lemons",
  "limes",
  "grapefruit",
  "bananas",
  "grapes",
  "strawberries",
  "blueberries",
  "raspberries",
  "blackberries",
  "cranberries",
  "cherry tomatoes",
  "cherries",
  "peaches",
  "nectarines",
  "plums",
  "apricots",
  ["mangoes", "mangos?", "mangoes"],
  "pineapple",
  "watermelon",
  "cantaloupe",
  "figs",
  "pomegranates",
  "persimmons",
  "kiwi",
  "avocados",
  "tomatoes",
  "sweet potatoes",
  "potatoes",
  "red onions",
  "onions",
  "shallots",
  "garlic",
  "leeks",
  "carrots",
  "celery",
  "celeriac",
  "parsnips",
  "beets",
  "radishes",
  "turnips",
  "cucumbers",
  "zucchini",
  "eggplant",
  ["jalapeños", "jalapenos?(?: peppers?)?"],
  ["sweet peppers", "(?:bell|sweet) peppers?", "peppers"],
  "corn",
  "snap peas",
  "peas",
  "green beans",
  "asparagus",
  "broccolini",
  "broccoli",
  ["cauliflower", "cauliflower(?: rice)?"],
  "red cabbage",
  "cabbage",
  "brussels sprouts",
  "kale",
  "spinach",
  "chard",
  ["lettuce", "(?:butter |romaine )?lettuces?", "romaine"],
  "arugula",
  "mushrooms",
  "butternut squash",
  ["winter squash", "(?:winter |acorn |spaghetti )?squash(?:es)?"],
  "pumpkin",
  "fennel",
  "artichokes",
  "ginger",
  "basil",
  "cilantro",
  "parsley",
  // meat and fish
  ["whole chicken", "whole chickens?"],
  ["chicken breasts", "chicken breasts?"],
  ["chicken thighs", "chicken thighs?", "thighs?"],
  ["chicken wings", "chicken wings?", "wings?"],
  ["chicken drumsticks", "(?:chicken )?drumsticks?"],
  "chicken",
  "ground turkey",
  "turkey",
  "ground beef",
  "brisket",
  "short ribs",
  ["pork ribs", "(?:pork )?(?:baby )?back ribs?", "spare ribs?"],
  ["pork chops", "pork (?:loin )?chops?"],
  "pork tenderloin",
  ["pork shoulder", "pork (?:butt|shoulder)s?"],
  ["ham", "ham(?: steaks?)?"],
  ["bacon", "(?:turkey )?bacon"],
  ["sausage", "(?:chicken |turkey |pork |italian )?sausages?"],
  "pork",
  ["steak", "steaks?"],
  "beef",
  ["lamb chops", "lamb (?:loin |rib )?chops?"],
  "lamb",
  "smoked salmon",
  "salmon",
  "cod",
  "halibut",
  "trout",
  "tuna",
  "shrimp",
  "scallops",
  "crab",
  "mussels",
  "clams",
  "tofu",
  "eggs",
  // dairy
  ["parmesan", "parmesan", "parmigiano(?: reggiano)?"],
  "cheddar",
  "mozzarella",
  "feta",
  "ricotta",
  "goat cheese",
  ["gruyère", "gruyere"],
  "halloumi",
  "burrata",
  "cream cheese",
  "sour cream",
  "heavy cream",
  "peanut butter",
  "butter",
  "yogurt",
  // pantry
  ["tortillas", "(?:corn |flour )?tortillas?"],
  "pasta",
  "rice",
  "quinoa",
  "lentils",
  "chickpeas",
  "black beans",
  "oats",
  "olive oil",
  "coconut milk",
  "walnuts",
  "almonds",
  "pecans",
  "pistachios",
  "hazelnuts",
  "cashews",
  "dates",
  "maple syrup",
  "honey",
];

/** Label wordings that contain an ingredient's name without being it */
const notIngredients = [
  "avocado oils?",
  "coconut oils?",
  "apple cider",
  "egg nog",
];

/**
 * Prepared foods and drinks named after what is in them ("Rao's Pasta Sauce",
 * "Apple Brown Butter Cookies"). An item that mentions any of these is not
 * bought to cook with, so none of its ingredients count.
 */
const prepared = new RegExp(
  `\\b(?:${[
    "juices?",
    "sauces?",
    "chips",
    "candy",
    "candies",
    "sodas?",
    "cereals?",
    "crackers?",
    "snacks?",
    "drinks?",
    "drinkables?",
    "creamers?",
    "shakes?",
    "smoothies?",
    "cookies?",
    "bars?",
    "pizzas?",
    "soups?",
    "kombuchas?",
    "coffees?",
    "teas?",
    "lattes?",
    "wines?",
    "beers?",
    "ciders?",
    "seltzers?",
    "ice cream",
    "gelato",
    "pies?",
    "cakes?",
    "muffins?",
    "breads?",
    "croissants?",
    "salads?",
    "dips?",
    "salsas?",
    "dressings?",
    "seasonings?",
    "spices?",
    "marinated",
    "gummies",
    "vitamins?",
    "protein",
    "powders?",
    "nuggets?",
    "cocktails?",
    "chocolates?",
    "puffs",
    "jerky",
    "granola",
    "lunchables?",
    "kits?",
    "entrees?",
    "ml",
    "fl oz",
  ].join("|")})\\b`
);

/** "strawberries" → "strawberr(?:y|ies)", "squash" → "squash(?:es)?", "apples" → "apples?" */
function singularOrPlural(term: string): string {
  const words = term.split(" ");
  const last = words.pop()!;
  const pattern = last.endsWith("ies")
    ? `${last.slice(0, -3)}(?:y|ies)`
    : /(?:oes|ches|shes|sses|xes)$/.test(last)
      ? `${last.slice(0, -2)}(?:es)?`
      : /(?:sh|ch|x|ss)$/.test(last)
        ? `${last}(?:es)?`
        : `${last.replace(/s$/, "")}s?`;

  return [...words, pattern].join(" ");
}

const entries = [
  ...vocabulary.map((entry) =>
    typeof entry === "string"
      ? { term: entry, patterns: [singularOrPlural(entry)] }
      : { term: entry[0], patterns: entry.slice(1) }
  ),
  ...notIngredients.map((pattern) => ({ term: undefined, patterns: [pattern] })),
]
  // at any one place in a name, the wording with the most words wins:
  // "sweet potatoes" over "potatoes", "turkey bacon" over "turkey"
  .map(({ term, patterns }) => ({
    term,
    pattern: patterns.join("|"),
    words: Math.max(...patterns.map((pattern) => pattern.split(" ").length)),
  }))
  .sort((a, b) => b.words - a.words);

const labelPattern = new RegExp(
  `\\b(?:${entries.map(({ pattern }) => `(${pattern})`).join("|")})\\b`,
  "g"
);

/** "Organic Honeycrisp™ Apples, 3 lb." → ["apples"] */
export function ingredientsIn(name: string): string[] {
  const label = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (prepared.test(label)) return [];

  const terms = [...label.matchAll(labelPattern)].flatMap(
    // the group that matched is the entry's
    (match) => entries[match.slice(1).findIndex(Boolean)].term ?? []
  );

  return [...new Set(terms)];
}

export type SaleIngredient = {
  term: string;
  /** the first item in each store's ad that names it */
  deals: { store: Store; item: SaleItem }[];
};

/**
 * The ingredients on sale across the stores. Those more stores discount come
 * first, then those their ads feature earliest.
 */
export function saleIngredients(
  storeItems: { store: Store; items: SaleItem[] }[]
): SaleIngredient[] {
  const found = new Map<string, SaleIngredient & { position: number }>();

  for (const { store, items } of storeItems) {
    items.forEach((item, position) => {
      for (const term of ingredientsIn(item.name)) {
        const ingredient = found.get(term) ?? { term, deals: [], position };
        if (!found.has(term)) found.set(term, ingredient);

        if (ingredient.deals.some((deal) => deal.store === store)) continue;
        ingredient.deals.push({ store, item });
        ingredient.position = Math.min(ingredient.position, position);
      }
    });
  }

  return [...found.values()]
    .sort((a, b) => b.deals.length - a.deals.length || a.position - b.position)
    .map(({ term, deals }) => ({ term, deals }));
}
