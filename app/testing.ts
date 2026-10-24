import { vi } from "vitest";

import type { OttolenghiRecipe } from "@/types";

export const ottolenghiHost = "ottolenghi-group.myshopify.com";

export function ottolenghiRecipe(
  title: string,
  fields: {
    main_ingredient?: string[];
    meal?: string[];
    collection?: string[];
    season?: string[];
  } = {},
  onlineStoreUrl: string | null = `https://ottolenghi.co.uk/pages/recipes/${title.toLowerCase().replace(/\W+/g, "-")}`
): OttolenghiRecipe {
  const list = (values?: string[]) =>
    values ? { value: JSON.stringify(values) } : null;

  return {
    onlineStoreUrl,
    title: { value: title },
    description: { value: `${title} description` },
    main_ingredient: list(fields.main_ingredient),
    meal: list(fields.meal),
    collection: list(fields.collection),
    season: list(fields.season),
    images: {
      references: {
        nodes: [{ image: { url: `https://cdn.shopify.com/${title}.jpg` } }],
      },
    },
  };
}

/** Serves the Storefront catalogue in pages, following the request's cursor */
export function ottolenghiCatalogue(pages: OttolenghiRecipe[][]) {
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

/** A card as Serious Eats renders it in search results and recipe listings */
export function seriousEatsCard(title: string, slug: string) {
  return `
<a class="comp mntl-card-list-items mntl-document-card mntl-card card card--no-image" data-doc-id="1" href="https://www.seriouseats.com/${slug}">
  <div class="loc card__top"><div class="card__media"><div class="img-placeholder">
    <img data-src="https://www.seriouseats.com/thmb/${slug}.jpg" width="282" height="188" alt="" class="lazyload card__img universal-image__image">
  </div></div></div>
  <div class="card__content" data-tag="Recipes">
    <div class="card__header"><span class="card__title"><span class="card__title-text">${title}</span></span></div>
    <div class="card__byline" data-byline="By Kenji López-Alt"></div>
  </div>
</a>`;
}

type StubResponse =
  | string
  | Response
  | ((init: RequestInit | undefined, url: URL) => string | Response);

/**
 * Replaces `fetch`, answering by hostname. Unlisted hosts get an empty page,
 * or an empty catalogue for the Ottolenghi storefront.
 */
export function stubFetch(responses: Record<string, StubResponse> = {}) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(input.toString());
    const stub =
      responses[url.hostname] ??
      (url.hostname === ottolenghiHost ? ottolenghiCatalogue([[]]) : "");
    const response = typeof stub === "function" ? stub(init, url) : stub;

    return response instanceof Response ? response : new Response(response);
  });
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}
