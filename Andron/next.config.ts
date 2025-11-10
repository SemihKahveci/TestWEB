/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return isDev
      ? [
          // Local gelistirmede: /admin -> Vite dev server (5173)
          { source: '/admin/:path*', destination: 'http://localhost:5173/:path*' },
        ]
      : [];
  },
};

export default nextConfig;
