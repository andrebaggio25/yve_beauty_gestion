# ============================================
# Dockerfile para Yve Gestión - Next.js App
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilitar telemetria do Next.js durante build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Variáveis de ambiente para build (Next.js precisa das NEXT_PUBLIC_* no build time)
# Estas serão passadas como build args e depois como env vars
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_EXCHANGE_RATE_API_KEY
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_DEFAULT_LOCALE

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=${NEXT_PUBLIC_EXCHANGE_RATE_API_KEY}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME:-Yve Gestión}
ENV NEXT_PUBLIC_DEFAULT_LOCALE=${NEXT_PUBLIC_DEFAULT_LOCALE:-pt-BR}

# Build da aplicação
RUN npm run build || (echo "Build failed. Check logs above." && exit 1)

# Stage 3: Runner (produção)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários do build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Variáveis de ambiente em runtime (pode ser sobrescrito pelo docker-compose)
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=""
ENV NEXT_PUBLIC_APP_NAME="Yve Gestión"
ENV NEXT_PUBLIC_DEFAULT_LOCALE="pt-BR"

USER nextjs

# Expor porta
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar
CMD ["node", "server.js"]

