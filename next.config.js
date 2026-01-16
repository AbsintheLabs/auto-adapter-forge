/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable server actions for form handling
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Environment variables that should be available on the client
  env: {
    // These will be replaced at build time
  },
};

module.exports = nextConfig;
