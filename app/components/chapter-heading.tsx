import { sourceInfo, type Source } from "@/sources";

import SourceSymbol from "./source-symbol";
import styles from "./field-guide.module.css";

/** "III. ▲ Ottolenghi ............ ottolenghi.co.uk" */
export default function ChapterHeading({ source }: { source: Source }) {
  const { numeral, name, symbol, domain } = sourceInfo[source];

  return (
    <div className={styles.chapter}>
      <span className={styles.numeral}>{numeral}.</span>
      <h2 className={styles.chapterTitle}>
        <SourceSymbol symbol={symbol} /> {name}
      </h2>
      <a
        href={`https://${domain}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.domain}
      >
        {domain}
      </a>
    </div>
  );
}
