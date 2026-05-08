import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.campushat\.com\/api\/v1\/(universities|mall\/categories)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-api-cache',
        expiration: { maxAgeSeconds: 86400 }, // 24h
      },
    },
    {
      urlPattern: /^https:\/\/api\.campushat\.com\/api\/v1\/mall\/products/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'products-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 300 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Don't fail production builds on lint warnings/errors. Lint should run in CI/dev.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Don't fail builds on TypeScript errors either — fast iteration > strict types here.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      { hostname: 'campushat.com' },
      { hostname: 's3.amazonaws.com' },
      { hostname: 'res.cloudinary.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/profile',
        destination: '/account',
        permanent: true,
      },
      {
        source: '/cart',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default withPWA(nextConfig)
