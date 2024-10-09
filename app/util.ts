import { queries, Query, Source } from "./search/data";

export type PartialRecord<K extends string, T> = {
  [P in K]?: T;
};

export const param = "q";

export function extract(value: FormDataEntryValue | null): string {
  return value && typeof value === "string" ? value : "";
}

export function getQuery(formData: FormData) {
  return extract(formData.get(param));
}

export function extractQuery<Q extends Query>(source: Source) {
  return queries.find((q) => q.source === source)! as Q;
}

export type Schema<V = unknown> = Record<string, V>;

function documentObject(item: Schema) {
  const schema = Object.keys(item).reduce<Schema>((acc, key) => {
    const value = item[key];

    if (typeof value === "object") {
      acc[key] = value ? documentObject(value as Schema) : null;
    } else {
      acc[key] = typeof value;
    }

    return acc;
  }, {});

  return schema;
}

export function generateSchema(items: Schema[]) {
  const schema = items.reduce<Schema<unknown[]>>((acc, item) => {
    const doc = documentObject(item);
    Object.keys(doc).forEach((key) => {
      const existing = acc[key];
      const next = doc[key];

      if (!existing) acc[key] = [next];
      else if (!existing.includes(next)) acc[key].push(next);
    });

    return acc;
  }, {});

  // cleanup
  return Object.keys(schema).reduce<Schema>((acc, key) => {
    const value = schema[key];

    acc[key] = Array.isArray(value) && value.length === 1 ? value[0] : value;
    return acc;
  }, {});
}
