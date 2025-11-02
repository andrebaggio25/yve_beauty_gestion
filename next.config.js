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
    // Ignorar erros de TypeScript durante builds temporariamente
    // TODO: Corrigir todos os erros de tipo e remover esta linha
    ignoreBuildErrors: true,
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
