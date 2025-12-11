/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,   // Désactive Turbopack (important pour Render)
  },
  output: "standalone"
};

module.exports = nextConfig;
