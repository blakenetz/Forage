# Forage

Forage for your next meal!

Search [New York Times Cooking](https://cooking.nytimes.com/), [Serious Eats](https://www.seriouseats.com/), [Ottolenghi](https://ottolenghi.co.uk/pages/recipes) and [Molly Baz](https://mollybaz.com/club/all-recipes/) at once. Each site's results stream in as it answers. The home page shows collections pulled from the sites themselves (NYT Cooking's seasonal feature and newest recipes, Serious Eats' newest recipes, Ottolenghi's newest and seasonal recipes, Molly Baz's recent and most popular) and is rebuilt hourly.

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
