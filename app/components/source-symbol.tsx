import type { SourceSymbol as SymbolName } from "@/sources";

import styles from "./field-guide.module.css";

const shapes: Record<SymbolName, React.ReactElement> = {
  disc: <circle cx="5" cy="5" r="4.2" fill="currentColor" />,
  square: <rect x="1.2" y="1.2" width="7.6" height="7.6" fill="currentColor" />,
  triangle: <path d="M5 .8 9.4 9H.6Z" fill="currentColor" />,
  ring: (
    <circle
      cx="5"
      cy="5"
      r="3.9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  ),
};

export default function SourceSymbol({ symbol }: { symbol: SymbolName }) {
  return (
    <svg className={styles.symbol} viewBox="0 0 10 10" aria-hidden="true">
      {shapes[symbol]}
    </svg>
  );
}
