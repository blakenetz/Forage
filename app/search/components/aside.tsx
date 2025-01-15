import React from "react";

import styles from "../search.module.css";

interface AsideProps {
  buttons?: React.ReactElement<any>[];
  actionIcon?: React.ReactElement<any>;
}

export default function Aside({ buttons, actionIcon }: AsideProps) {
  return (
    <aside className={styles.aside}>
      <div>{buttons}</div>
      {actionIcon}
    </aside>
  );
}
