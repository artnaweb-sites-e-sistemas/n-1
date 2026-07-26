/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Suprimir warnings de deprecação do Sass
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['legacy-js-api'],
  },
  images: {
    unoptimized: true,
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
        hostname: 'adminloja.n-1edicoes.org',
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
  // Proxy same-origin → WordPress (evita CORS/OPTIONS bloqueado no IIS)
  async rewrites() {
    return [
      {
        source: '/wp-api/:path*',
        destination: 'https://adminloja.n-1edicoes.org/wp-json/n1/v1/:path*',
      },
    ];
  },
}

module.exports = nextConfig
