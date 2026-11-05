import { useSyncExternalStore } from "react";

/**
 * The page URL's ?q= value. It is empty during server render and hydration, then filled in on the
 * client, so the server HTML and the first client render match.
 */
export function useUrlQuery() {
  return useSyncExternalStore(subscribeToNothing, readUrlQuery, () => "");
}

// The URL's query doesn't change while the page is open, so there is nothing to subscribe to.
function subscribeToNothing() {
  return () => {};
}

function readUrlQuery() {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}
