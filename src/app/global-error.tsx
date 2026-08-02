"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";

import "./globals.css";

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex h-screen w-screen items-center justify-center">
        <p className="text-2xl">Something went wrong.</p>
      </body>
    </html>
  );
}
