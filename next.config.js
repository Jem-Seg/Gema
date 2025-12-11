//** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Force Webpack instead of Turbopack
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
