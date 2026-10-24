/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // recipe photos come straight from each source's CDN, already sized
    unoptimized: true,
  },
};

export default nextConfig;
