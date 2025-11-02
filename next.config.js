/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Habilitar output standalone para Docker
  output: 'standalone',
  // Permitir warnings do ESLint durante build (erros ainda bloqueiam)
  eslint: {
    ignoreDuringBuilds: false,
  },
  // TypeScript: verificar tipos mas não bloquear build se houver erros menores
  typescript: {
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
