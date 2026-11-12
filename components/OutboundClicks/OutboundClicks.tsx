"use client";

import { useEffect } from "react";

import { track } from "@vercel/analytics";

import { outboundClickEvent } from "@/lib/referral";

// Counts clicks on links to listed organizations (links rendered with outboundLinkProps) as Vercel
// Web Analytics events. One listener on the document keeps the pages themselves server-rendered.
// Only the organization, the kind of listing and the page are sent: no cookies, no visitor id.

export default function OutboundClicks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Left click, or middle click to open in a new tab
      if (event.button !== 0 && event.button !== 1) return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>(
        "a[data-outbound][data-org]"
      );
      if (!link) return;
      track(outboundClickEvent, {
        org: link.dataset.org ?? "",
        kind: link.dataset.outbound ?? "",
        page: window.location.pathname,
      });
    };
    document.addEventListener("click", onClick);
    document.addEventListener("auxclick", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("auxclick", onClick);
    };
  }, []);
  return null;
}
