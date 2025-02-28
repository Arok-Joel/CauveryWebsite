/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Ensure static files in public directory are served
  experimental: {
    serverActions: true,
  },
  webpack(config) {
    return config;
  },
}

module.exports = nextConfig 