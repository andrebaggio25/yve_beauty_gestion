# 🔧 Corrigir Erros de Build Docker

## Problemas Comuns e Soluções

### 1. Erro: `npm run build` falha

**Causas possíveis:**
- Variáveis de ambiente faltando durante build
- Erros de TypeScript
- Falta de memória
- Dependências não instaladas corretamente

**Solução:**

1. **Verificar logs detalhados:**
   No Easypanel, veja os logs completos do build para identificar o erro específico.

2. **Usar Dockerfile alternativo:**
   Criei um `Dockerfile.easypanel` otimizado. Renomeie ou use como base:

   ```bash
   # Na VPS/Easypanel
   cp Dockerfile Dockerfile.backup
   cp Dockerfile.easypanel Dockerfile
   ```

3. **Variáveis de ambiente no build:**
   No Easypanel, configure as variáveis de ambiente necessárias:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_EXCHANGE_RATE_API_KEY` (opcional)

### 2. Erro: "No such image"

Isso geralmente acontece quando:
- Build anterior falhou
- Imagem não foi construída corretamente

**Solução:**
- Limpe o cache no Easypanel
- Rebuild do zero

### 3. Build falha por TypeScript

Se o erro for de TypeScript, você pode:

**Opção A: Corrigir os erros** (recomendado)
```bash
npm run type-check  # Localmente para ver erros
```

**Opção B: Ignorar erros temporariamente** (não recomendado)
Modifique o `package.json`:
```json
{
  "scripts": {
    "build": "next build || true"
  }
}
```

### 4. Build falha por falta de memória

**Solução:**
Adicione ao Dockerfile (stage builder):
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

### 5. Dependências nativas não compilam (Alpine)

**Solução:**
O `Dockerfile.easypanel` já inclui `python3 make g++` para compilar dependências nativas.

## 🔍 Debug do Build

### Passo 1: Ver logs completos

No Easypanel, copie o log completo do erro e identifique:
- Em qual stage falhou (deps, builder, runner)?
- Qual comando falhou?
- Mensagem de erro específica

### Passo 2: Testar localmente

```bash
# No seu computador
docker build -t yve-gestion-test .
docker run -p 3000:3000 yve-gestion-test
```

### Passo 3: Build incremental

Modifique o Dockerfile para parar em cada stage:

```dockerfile
# Teste stage 1
FROM node:20-alpine AS deps
# ... resto do código ...
# Adicione no final para testar:
RUN echo "Deps stage OK" && ls -la node_modules | head -5
```

## 🎯 Solução Rápida para Easypanel

1. **Use o Dockerfile.easypanel:**
   ```bash
   # No Easypanel, renomeie:
   mv Dockerfile Dockerfile.original
   mv Dockerfile.easypanel Dockerfile
   ```

2. **Configure variáveis de ambiente no Easypanel:**
   - Settings → Environment Variables
   - Adicione todas as `NEXT_PUBLIC_*` necessárias

3. **Aumente recursos se necessário:**
   - Easypanel pode ter limites de memória
   - Verifique se o plano permite builds grandes

4. **Limpe e rebuild:**
   - Remova containers/images antigas
   - Faça rebuild completo

## 📋 Checklist de Troubleshooting

- [ ] Variáveis de ambiente configuradas no Easypanel?
- [ ] Dockerfile usa multi-stage build corretamente?
- [ ] `next.config.js` tem `output: 'standalone'`?
- [ ] `package-lock.json` existe e está atualizado?
- [ ] Build funciona localmente (`docker build .`)?
- [ ] Logs mostram erro específico?
- [ ] Memória suficiente no VPS?

## 🚀 Dockerfile Melhorado

Criei `Dockerfile.easypanel` com:
- ✅ Melhor tratamento de erros
- ✅ Suporte a dependências nativas
- ✅ Logs mais detalhados
- ✅ Otimizações para Easypanel

**Use este arquivo como base ou renomeie para substituir o original.**

## 💡 Próximos Passos

1. Identifique o erro específico nos logs
2. Use `Dockerfile.easypanel` 
3. Configure variáveis de ambiente
4. Rebuild
5. Se ainda falhar, envie o log completo do erro para análise mais específica

