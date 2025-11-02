# 🔧 Solução: Variáveis de Ambiente no Build

## Problema

O build está falhando porque:
1. O Next.js tenta fazer static generation durante build
2. As páginas usam `createClient()` do Supabase que precisa das variáveis de ambiente
3. As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estão disponíveis durante o build no Docker

## Soluções Aplicadas

### 1. Dockerfile Ajustado
- Agora funciona mesmo se `.next/standalone` não for gerado
- Usa build padrão se standalone não existir

### 2. Cliente Supabase Melhorado
- Tratamento de erro melhor quando variáveis não estão disponíveis
- Evita crash durante build

## ⚠️ Ação Necessária no Easypanel

**Configure as variáveis de ambiente no Easypanel:**

1. Vá em **Settings** → **Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anon do Supabase

**IMPORTANTE:** Essas variáveis devem estar configuradas ANTES do build!

## Alternativa: Configurar como Build Args

Se preferir passar durante o build:

No Dockerfile, os ARGs já estão configurados:
```dockerfile
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
```

No Easypanel, configure como Build Arguments (se a opção existir).

## ✅ Próximos Passos

1. **Configure as variáveis no Easypanel**
2. **Faça commit e push das alterações**
3. **Rebuild no Easypanel**

O build deve funcionar agora!

