/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // basePath sadece production'da aktif olsun
  basePath: process.env.NODE_ENV === 'production' ? '/home' : '',
};

export default nextConfig;