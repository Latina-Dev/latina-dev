// Next.js loads this file in the browser (with Turbopack it no longer picks up
// sentry.client.config.ts on its own). Sentry's SDK and Session Replay are
// large, so they load after the page does to keep them off the critical path
// for first paint and LCP. Errors thrown before then are not reported.
function loadSentry() {
  void import("./sentry.client.config");
}

if (typeof window !== "undefined") {
  if (document.readyState === "complete") {
    loadSentry();
  } else {
    window.addEventListener("load", loadSentry, { once: true });
  }
}
