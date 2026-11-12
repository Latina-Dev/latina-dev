import { useSyncExternalStore } from "react";

/**
 * A value from the page URL's query string, ?q= unless another name is given. It is empty during
 * server render and hydration, then filled in on the client, so the server HTML and the first
 * client render match.
 * @param name query parameter to read, e.g. "q" or "type"
 */
export function useUrlQuery(name = "q") {
  return useSyncExternalStore(
    subscribeToNothing,
    () => new URLSearchParams(window.location.search).get(name) ?? "",
    () => ""
  );
}

// The page only reads the URL's query when it loads, so there is nothing to subscribe to.
function subscribeToNothing() {
  return () => {};
}
