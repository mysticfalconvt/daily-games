import type { Metadata } from "next";
import { Suspense } from "react";

import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import AppNavbar from "@/components/app-navbar";
import Providers from "@/components/providers";
import { env } from "@/env/server";

import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Game Scores",
  description: "A place for friends to share their daily game scores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = env.NODE_ENV === "production";
  const umamiId = env.UMAMI_ID || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📦</text></svg>"
        />
        {isProduction && (
          <script
            async
            src="https://umami.rboskind.com/script.js"
            data-website-id={umamiId}
          ></script>
        )}
      </head>
      <body className="h-screen w-screen">
        {/*
          Backdrop lives here rather than on <main> so it stays put while the
          content scrolls. Swap the pattern modifier to change the motif -
          see globals.css for the alternatives.
        */}
        {/*
          Arbitrary z values, not `-z-20`: Tailwind's default z-index scale has
          no negative entries, so `-z-*` silently produced no rule at all and
          these layers stacked wrongly.
        */}
        <div
          aria-hidden
          className="app-pattern--tiles pointer-events-none fixed inset-0 z-[-20]"
        />
        <div
          aria-hidden
          className="app-glow pointer-events-none fixed inset-0 z-[-10]"
        />
        <Providers>
          <ImpersonationBanner />
          <AppNavbar />
          <main className="flex-grow overflow-auto">
            <Suspense>{children}</Suspense>
          </main>
        </Providers>
      </body>
    </html>
  );
}
