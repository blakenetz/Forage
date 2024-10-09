/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
  },
  images: {
    remotePatterns: [
      { hostname: "**.nyt.com" },
      { hostname: "**.seriouseats.com" },
      { hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
