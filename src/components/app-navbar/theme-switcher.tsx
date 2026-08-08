"use client";

import { useEffect, useState } from "react";

import { Button } from "@nextui-org/react";
import { IconMoon, IconSun } from "@tabler/icons-react";

import useSystemTheme from "@/hooks/use-system-theme";

/**
 * A compact icon toggle. This was a large green NextUI Switch, which read as an
 * unrelated status control rather than a theme switch.
 */
export function ThemeSwitcher({ showLabel }: { showLabel?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useSystemTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reserve the space so the navbar does not shift when this mounts.
  if (!mounted) {
    return <div className="h-10 w-10" aria-hidden />;
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (showLabel) {
    return (
      <Button
        variant="light"
        onPress={() => setTheme(isDark ? "light" : "dark")}
        startContent={isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
        className="w-full justify-start"
      >
        {isDark ? "Light mode" : "Dark mode"}
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      radius="full"
      variant="light"
      aria-label={label}
      title={label}
      onPress={() => setTheme(isDark ? "light" : "dark")}
      className="text-foreground/70 data-[hover=true]:text-foreground"
    >
      {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </Button>
  );
}
