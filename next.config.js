/** @type {import('next').NextConfig} */
const nextConfig = {
  // Render needs standalone output
  output: "standalone",

  // Disable Turbopack explicitly for Next.js 16
  experimental: {
    serverMinification: false,  // important
    typedRoutes: false,
    turbo: {
      // Désactivation explicite
      loader: "webpack",
    },
  },

  // Force Webpack
  webpack(config) {
    return config;
  },
};

module.exports = nextConfig;
