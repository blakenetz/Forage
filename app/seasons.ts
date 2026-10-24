export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

/** Northern-hemisphere meteorological seasons, matching Ottolenghi's tags */
export function seasonOf(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}

/** Suggested searches for produce at its best, indexed by month (0 = January) */
export const inSeason: string[][] = [
  ["blood oranges", "leeks", "kale", "parsnips", "celeriac"],
  ["blood oranges", "cauliflower", "leeks", "rhubarb", "celeriac"],
  ["rhubarb", "leeks", "spring onions", "kale", "cauliflower"],
  ["asparagus", "ramps", "radishes", "rhubarb", "spinach"],
  ["asparagus", "peas", "fava beans", "radishes", "new potatoes"],
  ["strawberries", "peas", "zucchini", "cherries", "fava beans"],
  ["tomatoes", "zucchini", "cherries", "apricots", "corn"],
  ["tomatoes", "corn", "peaches", "plums", "eggplant"],
  ["figs", "plums", "apples", "tomatoes", "corn"],
  ["leeks", "squash", "quince", "chestnuts", "celeriac"],
  ["squash", "chestnuts", "cranberries", "brussels sprouts", "parsnips"],
  ["brussels sprouts", "clementines", "parsnips", "chestnuts", "red cabbage"],
];
