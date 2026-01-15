/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suprimir warnings de deprecação do Sass
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['legacy-js-api'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: 'i.ibb.co',
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: 'res.cloudinary.com',
        pathname: "**",
      },
      // WordPress/WooCommerce images
      {
        protocol: "https",
        hostname: 'loja.n-1edicoes.org',
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: 'n-1.artnaweb.com.br',
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: 'localhost',
        pathname: "**",
      },
    ],
  },
  // Suprimir warnings durante o build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Logging apenas para erros
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

module.exports = nextConfig
