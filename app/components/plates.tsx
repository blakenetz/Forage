import Image from "next/image";

import type { Recipe } from "@/search/data";

import styles from "./field-guide.module.css";

function caption({ meta }: Recipe) {
  return [
    meta.time,
    meta.ratingCount
      ? `${meta.ratingCount.toLocaleString("en-US")} ratings`
      : undefined,
    meta.tags,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Plate({
  recipe,
  number,
  eager,
}: {
  recipe: Recipe;
  number: number;
  eager?: boolean;
}) {
  const details = caption(recipe);
  const external = { target: "_blank", rel: "noopener noreferrer" };

  return (
    <figure className={styles.plate}>
      {/* the title link below is the accessible one; the image repeats it for pointers */}
      <a
        href={recipe.link}
        {...external}
        className={styles.image}
        tabIndex={-1}
        aria-hidden="true"
      >
        {recipe.img ? (
          <Image
            src={recipe.img}
            alt=""
            fill
            loading={eager ? "eager" : "lazy"}
          />
        ) : (
          <span className={styles.noImage}>No photograph</span>
        )}
      </a>
      <figcaption className={styles.caption}>
        <span className={styles.number}>{number}</span>
        <div>
          <a href={recipe.link} {...external} className={styles.title}>
            {recipe.title}
          </a>
          {recipe.author && <div className={styles.author}>{recipe.author}</div>}
          {details && <div className={styles.details}>{details}</div>}
        </div>
      </figcaption>
    </figure>
  );
}

/**
 * Numbered plates. Past `visible`, the rest sit in a closed `<details>`, which
 * expands in place without client JavaScript and defers their lazy images.
 */
export function Plates({
  recipes,
  visible = recipes.length,
  moreLabel,
  eager,
}: {
  recipes: Recipe[];
  visible?: number;
  moreLabel?: string;
  /** load the first row immediately: it is likely above the fold */
  eager?: boolean;
}) {
  const rest = recipes.slice(visible);

  return (
    <>
      <div className={styles.plates}>
        {recipes.slice(0, visible).map((recipe, i) => (
          <Plate
            key={`${i}-${recipe.link}`}
            recipe={recipe}
            number={i + 1}
            eager={eager}
          />
        ))}
      </div>
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary>
            <span className={styles.moreClosed}>{moreLabel}</span>
            <span className={styles.moreOpen}>Show fewer</span>
          </summary>
          <div className={styles.plates}>
            {rest.map((recipe, i) => (
              <Plate
                key={`${i}-${recipe.link}`}
                recipe={recipe}
                number={visible + i + 1}
              />
            ))}
          </div>
        </details>
      )}
    </>
  );
}

/** Blank plates that hold the layout while a source is still answering */
export function PendingPlates({ count }: { count: number }) {
  return (
    <div className={styles.plates} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.plate}>
          <div className={`${styles.image} ${styles.pending}`} />
        </div>
      ))}
    </div>
  );
}
