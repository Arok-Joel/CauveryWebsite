/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure static files in public directory are served
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'royal-cauvery-farms.vercel.app'],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable Next.js built-in ESLint to use our custom config
  },
  webpack(config) {
    return config;
  },
}

module.exports = nextConfig 