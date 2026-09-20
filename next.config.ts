import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/samples/report", destination: "/sample-report", permanent: false }];
  },
};

export default nextConfig;
