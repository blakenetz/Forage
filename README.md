# Forage

Forage for your next meal!

Search [New York Times Cooking](https://cooking.nytimes.com/), [Serious Eats](https://www.seriouseats.com/), [Ottolenghi](https://ottolenghi.co.uk/pages/recipes) and [Molly Baz](https://mollybaz.com/club/all-recipes/) at once. Each site's results stream in as it answers. The home page shows collections pulled from the sites themselves (the first two collections NYT Cooking features plus its newest recipes, Serious Eats' newest recipes, Ottolenghi's newest and seasonal recipes, Molly Baz's recent and most popular), refetched at most hourly.

After the kitchens, the home page shows **what's on sale** this week at the nearest [Whole Foods Market](https://www.wholefoodsmarket.com/sales-flyer), [King Soopers](https://www.kingsoopers.com/weeklyad) and [Sprouts](https://www.sprouts.com/weekly-ad/): each store's price list, and every ingredient on sale as a search of all four kitchens (the top five also sit beside "In season now"). Whole Foods comes from its own store finder and sales flyer; King Soopers and Sprouts from their weekly ads as [Flipp](https://flipp.com/) reads them. The zip code is the one asked for (`/?zip=80202`), else the last one asked for (kept in a cookie), else the one Vercel derives from the visitor's IP address (city-level, deployed only); "Use my location" turns the browser's coordinates into a zip code through the [US Census geocoder](https://geocoding.geo.census.gov/geocoder/).

Deployed at <https://forage-drab.vercel.app/>

## Tech stack

- [Next.js](https://nextjs.org/) App Router, server-rendered with plain CSS modules
- [node-html-parser](https://github.com/taoqf/node-html-parser) for scraping search pages

## Development

Requires Node.js 22+.

```sh
npm run dev        # start the dev server
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
npm test           # vitest
```
