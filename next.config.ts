import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Native / WASM packages used by local PDF OCR — keep out of the webpack bundle.
  serverExternalPackages: ["@napi-rs/canvas", "tesseract.js", "pdfjs-dist", "unpdf"],
  async redirects() {
    return [{ source: "/samples/report", destination: "/sample-report", permanent: false }];
  },
};

export default nextConfig;
