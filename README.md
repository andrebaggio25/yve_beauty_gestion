# Yve Gestión - Sistema de Gestão Financeira e Administrativa

Aplicação web moderna para gestão financeira, faturamento, clientes e funcionários, desenvolvida com Next.js, TypeScript, Tailwind CSS e Supabase.

## 🚀 Características Principais

- **Autenticação segura** com Supabase Auth
- **Gestão de Clientes** com validações internacionais
- **Contas a Pagar e Receber** com suporte a múltiplas moedas
- **Faturamento** com numeração contínua e envio por e-mail
- **Relatórios Financeiros** (DRE, Balanço, Fluxo de Caixa, Aging)
- **Multi-idioma** (Português, Espanhol, Inglês)
- **RLS (Row Level Security)** para segurança de dados por empresa/filial
- **Auditoria completa** de todas as ações do sistema
- **Interface mobile-first** responsiva

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase (https://supabase.com)

## 🔧 Setup Inicial

### 1. Clonar o repositório

```bash
git clone <seu-repositorio>
cd app_yve_gestion
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Supabase

#### a) Criar novo projeto no Supabase
- Acessar https://supabase.com
- Criar novo projeto
- Anotar `SUPABASE_URL` e `SUPABASE_ANON_KEY`

#### b) Executar migração do banco de dados
1. No Supabase, ir para **SQL Editor**
2. Copiar o conteúdo de `migration_inicial.sql`
3. Colar e executar no editor SQL

#### c) Criar Storage Buckets
1. No Supabase, ir para **Storage**
2. Criar 3 buckets com nomes:
   - `invoices`
   - `contracts`
   - `attachments`
3. Configurar políticas RLS para cada bucket (permitir acesso autenticado)

#### d) Configurar Auth
1. Ir para **Authentication** → **Providers**
2. Habilitar "Email"
3. (Opcional) Configurar OAuth providers (Google, GitHub, etc)

### 4. Configurar variáveis de ambiente

Criar arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key

# Optional: Exchange Rate API
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=sua-api-key-opcional

# App Configuration
NEXT_PUBLIC_APP_NAME=Yve Gestión
NEXT_PUBLIC_DEFAULT_LOCALE=pt-BR
```

### 5. Criar primeiro usuário master

1. No Supabase, ir para **Authentication** → **Users**
2. Clicar em **Create a new user**
3. Informar email e senha
4. Verificar que o usuário foi criado

### 6. Iniciar desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
app_yve_gestion/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas de autenticação
│   │   ├── login
│   │   └── register
│   ├── (dashboard)/       # Aplicação principal
│   │   ├── page.tsx       # Dashboard
│   │   ├── customers/     # Módulo de Clientes
│   │   ├── employees/     # Módulo de Funcionários
│   │   ├── finance/       # Módulo Financeiro
│   │   ├── billing/       # Módulo de Faturamento
│   │   ├── reports/       # Módulo de Relatórios
│   │   ├── settings/      # Configurações
│   │   ├── audit/         # Logs de Auditoria
│   │   └── layout.tsx
│   ├── layout.tsx         # Layout raiz
│   ├── globals.css        # Estilos globais
│   └── page.tsx          # Página inicial
├── components/            # Componentes React
│   ├── Navigation.tsx     # Menu de navegação
│   ├── ProtectedRoute.tsx # Proteção de rotas
│   ├── PermissionGate.tsx # Gate de permissões
│   └── ui/               # Componentes shadcn/ui
├── lib/                   # Utilidades e configuração
│   ├── supabase/         # Clientes Supabase
│   ├── contexts/         # Contextos React
│   ├── i18n/             # Configuração i18n
│   └── utils/            # Funções utilitárias
├── hooks/                # Hooks personalizados
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useAuditLog.ts
├── types/                # Tipagens TypeScript
│   ├── auth.ts
│   ├── common.ts
│   └── [modulo].ts
├── locales/              # Arquivos de tradução
│   ├── pt-BR/
│   ├── es-ES/
│   └── en-US/
├── modules/              # Lógica de negócio por módulo
│   ├── customers/
│   ├── finance/
│   ├── billing/
│   └── reports/
├── middleware.ts         # Middleware Next.js
├── package.json
├── tailwind.config.ts    # Configuração Tailwind
└── tsconfig.json         # Configuração TypeScript
```

## 📦 Dependências Principais

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilos CSS
- **Supabase** - Backend e autenticação
- **React Hook Form + Zod** - Validação de formulários
- **TanStack Query** - Cache de dados
- **i18next** - Internacionalização
- **libphonenumber-js** - Validação de telefones
- **Recharts** - Gráficos
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

## 🔐 Segurança

### RLS (Row Level Security)
- Todos os dados são segregados por empresa/filial via JWT
- Políticas RLS protegem acesso a dados não autorizados
- Verificação de permissões no nível de banco de dados

### Autenticação
- Email + Senha via Supabase Auth
- Sessão mantida via cookies HTTP-only
- Middleware verifica autenticação em cada requisição

### Auditoria
- Todos as ações são registradas em `audit_log`
- Rastreamento de usuário, hora, ação e dados modificados
- Logs imutáveis para conformidade

## 🌍 Internacionalização

Sistema suporta 3 idiomas:
- **Português Brasileiro** (pt-BR) - Padrão
- **Espanhol** (es-ES)
- **Inglês Americano** (en-US)

Idioma é selecionado por usuário e persiste em localStorage.

## 💱 Multi-moeda

- Suporte a múltiplas moedas (USD, EUR, BRL, etc)
- Conversão automática para USD (moeda base contábil)
- Taxas de câmbio atualizadas via API
- Valores em USD nunca são mostrados ao cliente

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Seguir as instruções do Vercel CLI para deploy.

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start"]
```

```bash
docker build -t yve-gestion .
docker run -p 3000:3000 --env-file .env.local yve-gestion
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm start            # Iniciar servidor produção
npm run lint         # Linter
npm run type-check   # TypeScript check
```

## 🐛 Troubleshooting

### Erro de conexão com Supabase
- Verificar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Confirmar que o projeto Supabase está ativo
- Verificar políticas CORS no Supabase

### Erro "user not found"
- Criar usuário em Authentication → Users no Supabase
- Verificar que o email foi confirmado

### Erro de permissão no banco de dados
- Confirmar que migration foi executada completamente
- Verificar políticas RLS no banco de dados
- Confirmar que JWT contém `company_id`

## 📚 Documentação

- [Estrutura de Sistema](./estrutura_sistema.md)
- [Migration do Banco](./migration_inicial.sql)
- [Plan de Implementação](./yve-gesti-n-mvp.plan.md)

## 👥 Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue no repositório.

## 📄 Licença

Propriedade de Yve Beauty / Yve Gestión

