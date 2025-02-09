import type { Metadata } from "next";
import { Suspense } from "react";

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
        <Providers>
          <AppNavbar />
          <main className="flex-grow overflow-auto bg-[url(/light-bg.svg)] bg-cover dark:bg-[url(/dark-bg.svg)]">
            <Suspense>{children}</Suspense>
          </main>
        </Providers>
      </body>
    </html>
  );
}
