/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.advancedsystems-int.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
      { protocol: 'https', hostname: '*.railway.app', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp', 'image/avif'],
  },
  async redirects() {
    return [
      { source: '/product/:path*', destination: '/part-number/:path*', permanent: true },
    ]
  },
  async rewrites() {
    return [{ source: '/sitemap-products.xml', destination: '/sitemap-products' }]
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compress: true,
}

export default nextConfig
