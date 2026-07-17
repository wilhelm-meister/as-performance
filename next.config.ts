import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads (Logo, Fahrzeugschein-Foto) laufen über Server Actions (Standardlimit wäre 1 MB)
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
