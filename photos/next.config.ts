import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Media is served straight from Supabase's CDN with plain <img>/<video> tags,
  // so we don't need Next's image optimizer (which would cost Vercel quota).
  poweredByHeader: false,
};

export default nextConfig;
