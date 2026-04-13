"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ textAlign: "center", padding: "80px 24px", fontFamily: "sans-serif" }}>
          <h2>Something went wrong</h2>
          <p style={{ marginTop: "16px" }}>An unexpected error occurred. Please try again.</p>
          <button
            onClick={reset}
            style={{ marginTop: "24px", padding: "12px 24px", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
