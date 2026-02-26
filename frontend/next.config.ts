import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the production Docker image (copies only needed files)
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Google profile pictures (used by NextAuth Google provider)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
