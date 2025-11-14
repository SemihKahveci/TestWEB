/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Artık basePath kullanmıyoruz, URL'ler root'tan gelecek
  // basePath: process.env.NODE_ENV === 'production' ? '/home' : '',
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/home' : '',
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
