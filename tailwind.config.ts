import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

/**
 * The app draws from two systems: shadcn-style CSS variables (globals.css) and
 * NextUI's own palette. They were previously unrelated, so a NextUI
 * `color="primary"` button and a `bg-primary` div were different colours. These
 * hex values mirror the HSL tokens in globals.css - keep them in step.
 */
const brand = {
  50: "#F0EDFE",
  100: "#E1DBFD",
  200: "#C6BAFB",
  300: "#AB99F8",
  400: "#9076F9",
  500: "#7A5FF0",
  600: "#6349E4",
  700: "#4E36BE",
  800: "#3A2891",
  900: "#241A5C",
};

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      textShadow: {
        lg: "0 2px 4px rgba(0,0,0,0.2)",
      },
    },
  },
  darkMode: ["class", "class"],
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#F5F6FA",
            foreground: "#0F1629",
            content1: "#FFFFFF",
            divider: "#E1E4EE",
            focus: brand[600],
            primary: { ...brand, DEFAULT: brand[600], foreground: "#FFFFFF" },
          },
        },
        dark: {
          colors: {
            background: "#0A0E1A",
            // Lifted off the page background so NextUI cards, popovers and the
            // navbar read as surfaces.
            content1: "#151A28",
            foreground: "#F8FAFC",
            divider: "#2B3245",
            focus: brand[400],
            primary: { ...brand, DEFAULT: brand[400], foreground: "#12183A" },
          },
        },
      },
    }),
    require("tailwindcss-animate"),
    require("tailwindcss-textshadow"),
  ],
};
export default config;
