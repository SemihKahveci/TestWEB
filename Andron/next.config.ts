/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // basePath kaldırıldı - middleware ile yönetiliyor
  // assetPrefix sadece production'da aktif olsun (asset'ler için)
  assetPrefix: process.env.NODE_ENV === 'production' ? '/home' : '',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
};

export default nextConfig;