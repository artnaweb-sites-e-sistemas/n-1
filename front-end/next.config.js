/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
}

module.exports = nextConfig
