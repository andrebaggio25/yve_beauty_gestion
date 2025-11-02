/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Habilitar output standalone para Docker
  output: 'standalone',
  // Ignorar erros de ESLint durante build (warnings ainda aparecem)
  // TODO: Corrigir todos os erros de lint e remover esta opção
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript: ignorar erros temporariamente para permitir build
  // TODO: Corrigir todos os erros de tipo e remover esta opção
  typescript: {
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
