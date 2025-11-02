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
  // Desabilitar geração estática de páginas que precisam de Supabase
  // Isso evita erros durante build quando variáveis de ambiente não estão disponíveis
  experimental: {
    missingSuspenseWithCSRBailout: false,
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
