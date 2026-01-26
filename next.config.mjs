import createJiti from "jiti";
import { fileURLToPath } from "node:url";
import path from "path";

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti("./src/env/server.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
    };
    return config;
  },
};

export default nextConfig;
