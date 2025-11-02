/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Habilitar output standalone para Docker
  output: 'standalone',
  // Ignorar erros de ESLint durante builds (warnings ainda aparecem)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Não ignorar erros de TypeScript (mantém qualidade)
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
