import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logo-Upload läuft über eine Server Action (Standardlimit wäre 1 MB)
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
