/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    serverActions: true
  },

  typescript: {
    ignoreBuildErrors: false
  },

  eslint: {
    ignoreDuringBuilds: true
  },

  poweredByHeader: false,
};

module.exports = nextConfig;
