"use client";

import { MouseEvent, ReactNode } from "react";

// Closes the <details> menu when a link inside it is chosen, since the shared
// layout keeps it open across client navigation. Without JS it still toggles.
export default function MobileMenu({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const closeOnLink = (event: MouseEvent<HTMLDetailsElement>) => {
    if ((event.target as HTMLElement).closest("a")) {
      event.currentTarget.open = false;
    }
  };

  return (
    <details className={className} onClick={closeOnLink}>
      {children}
    </details>
  );
}
