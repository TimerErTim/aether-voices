import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // For GitHub Pages subpath e.g. /aether-voices/
  // basePath: process.env.NODE_ENV === "production" ? "/aether-voices" : "",
  // assetPrefix: process.env.NODE_ENV === "production" ? "/aether-voices/" : "",
};

export default nextConfig;
