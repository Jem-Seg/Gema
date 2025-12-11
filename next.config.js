/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nécessaire pour Render
  output: "standalone",

  // IMPORTANT pour Next.js 16 :
  // Déclare une config turbopack vide pour éviter l'erreur
  turbopack: {},

  // Force Webpack au lieu de Turbopack
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
