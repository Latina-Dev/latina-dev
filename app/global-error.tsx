"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ textAlign: "center", padding: "80px 24px", fontFamily: "sans-serif" }}>
          <h2>Something went wrong</h2>
          <p style={{ marginTop: "16px" }}>An unexpected error occurred. Please try again.</p>
        </div>
      </body>
    </html>
  );
}
