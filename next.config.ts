import type { NextConfig } from "next";

/**
 * Next.js configuration.
 * Kept intentionally minimal: the app only needs the App Router and
 * server-side fetch to OpenRouter/Deepgram.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
