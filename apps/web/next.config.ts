import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for Docker — `.next/standalone` ships only
  // what the runtime needs, ~20× smaller than the full project tree.
  output: "standalone",
  // Without this, the standalone tracer roots at `apps/web` and misses the
  // workspace packages, so the image crashes at boot trying to load
  // `@jasmin/{ui,lib,db}`. Pinning the tracer to the repo root pulls them in.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@jasmin/ui", "@jasmin/lib", "@jasmin/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      { protocol: "http", hostname: "localhost", port: "54321" },
    ],
  },
};

export default config;
