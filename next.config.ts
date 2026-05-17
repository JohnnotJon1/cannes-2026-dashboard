import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — the parent directory contains
  // another package-lock.json (John's scratch space), which would otherwise
  // confuse Turbopack's root detection.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
