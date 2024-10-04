"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

import { NextUIProvider } from "@nextui-org/react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <SessionProvider>
      <NextUIProvider
        // @ts-expect-error nextjs
        navigate={router.push}
        className="flex h-full w-full flex-col"
      >
        <NextThemesProvider attribute="class">{children}</NextThemesProvider>
      </NextUIProvider>
    </SessionProvider>
  );
}
