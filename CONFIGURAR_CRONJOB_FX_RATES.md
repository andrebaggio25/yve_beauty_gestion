# Configurar Cronjob para Atualização de Taxas de Câmbio

## 📅 Horário Recomendado

**Melhor horário para atualizar cotações:** 10:00 BRT (Horário de Brasília)
- Equivale a **13:00 UTC**
- Este horário garante que as taxas estejam disponíveis antes do início do expediente

## 🚀 Opções de Configuração

### Opção 1: Vercel Cron (Recomendado se estiver no Vercel)

1. Crie ou edite o arquivo `vercel.json` na raiz do projeto:

```json
{
  "crons": [
    {
      "path": "/api/fx-rates/update",
      "schedule": "0 13 * * *"
    }
  ]
}
```

2. Faça commit e push:
```bash
git add vercel.json
git commit -m "Add cronjob for FX rates update"
git push
```

3. A Vercel configurará automaticamente o cronjob após o deploy.

**Observações:**
- O cronjob roda apenas em produção (não roda em preview deployments)
- Requer plano Vercel Pro ou superior para cronjobs customizados
- Verifique em: Dashboard Vercel → Settings → Cron Jobs

### Opção 2: Serviço Externo Gratuito (cron-job.org)

1. Acesse: https://cron-job.org (gratuito)
2. Crie uma conta (ou faça login)
3. Clique em "Create cronjob"
4. Preencha:
   - **Title:** Atualizar Taxas de Câmbio
   - **Address:** `https://seu-dominio.com/api/fx-rates/update`
   - **Schedule:** Diariamente
   - **Time:** 13:00 UTC (10:00 BRT)
   - **Timezone:** UTC
   - **Save**

5. Salve o cronjob

**Vantagens:**
- Gratuito
- Funciona com qualquer hospedagem
- Pode configurar múltiplos horários

### Opção 3: EasyCron

1. Acesse: https://www.easycron.com
2. Crie uma conta (plano gratuito disponível)
3. Adicione novo cronjob:
   - **URL:** `https://seu-dominio.com/api/fx-rates/update`
   - **Schedule:** Daily at 13:00 UTC
   - **HTTP Method:** GET

### Opção 4: GitHub Actions (Se usar GitHub)

Crie o arquivo `.github/workflows/fx-rates-update.yml`:

```yaml
name: Update FX Rates

on:
  schedule:
    # Roda diariamente às 13:00 UTC (10:00 BRT)
    - cron: '0 13 * * *'
  workflow_dispatch: # Permite execução manual

jobs:
  update-rates:
    runs-on: ubuntu-latest
    steps:
      - name: Call FX Rates API
        run: |
          curl -X GET https://seu-dominio.com/api/fx-rates/update
```

**Nota:** Requer que sua aplicação esteja rodando (não funciona apenas com o repositório).

### Opção 5: Teste Manual

Para testar antes de configurar o cronjob:

```bash
# Via terminal
curl https://seu-dominio.com/api/fx-rates/update

# Ou via navegador
https://seu-dominio.com/api/fx-rates/update
```

## ✅ Verificação

Após configurar, verifique se está funcionando:

1. Aguarde o horário configurado
2. Verifique no Supabase se as taxas foram inseridas:
```sql
SELECT * FROM fx_rate 
WHERE date = CURRENT_DATE 
AND base IN ('EUR', 'BRL') 
AND quote = 'USD'
ORDER BY date DESC, base;
```

3. Ou chame a API manualmente para verificar:
```bash
curl https://seu-dominio.com/api/fx-rates/update
```

Deve retornar:
```json
{
  "success": true,
  "message": "Taxas atualizadas com sucesso",
  "date": "2025-01-15",
  "rates": {
    "EUR": 1.0869,
    "BRL": 0.20
  }
}
```

## 📝 Notas Importantes

1. **API Key:** Certifique-se de ter `NEXT_PUBLIC_EXCHANGE_RATE_API_KEY` configurada no `.env` para produção
2. **Segurança:** A API é pública, mas não expõe informações sensíveis
3. **Idempotência:** A API verifica se já atualizou hoje antes de fazer nova requisição
4. **Fallback:** Se a API externa falhar, não quebra o sistema (apenas não atualiza as taxas)

## 🔧 Troubleshooting

### Problema: Cronjob não está rodando
- Verifique se o domínio está correto
- Confirme que a aplicação está online
- Verifique logs da aplicação para erros

### Problema: Taxas não estão sendo atualizadas
- Execute manualmente para ver o erro
- Verifique variáveis de ambiente
- Confirme que a tabela `fx_rate` existe e tem as colunas corretas

### Problema: Erro 401/403
- Verifique configurações de CORS
- Confirme que a rota não requer autenticação

## 🎯 Recomendação Final

**Para desenvolvimento local/testes:** Use cron-job.org (gratuito e fácil)
**Para produção:** Use Vercel Cron se estiver na Vercel, caso contrário use cron-job.org

