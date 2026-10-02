import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // uploads locais de documentos/fotos
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
