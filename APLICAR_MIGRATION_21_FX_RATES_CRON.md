# Aplicar Migration 21 - Configurar Auto-Update de Taxas de Câmbio

## Objetivo

Configurar atualização automática diária de taxas de câmbio EUR-USD e BRL-USD usando `pg_cron` do Supabase, sem depender de serviços externos.

## O que faz

1. **Habilita extensões necessárias:**
   - `pg_cron`: Para agendar jobs SQL
   - `http`: Para fazer chamadas HTTP do PostgreSQL

2. **Cria função SQL:**
   - `update_fx_rates_from_api()`: Chama a API route existente para atualizar taxas

3. **Configura cron job:**
   - Roda diariamente às 13:00 UTC (10:00 BRT)
   - Chama automaticamente a função de atualização

## Como Aplicar

### Passo 1: Configurar URL da API

Antes de executar a migration, você precisa configurar a URL da API nas configurações do Supabase:

1. Acesse **Supabase Dashboard** → Seu Projeto → **Settings** → **Database**
2. Role até **Custom Config**
3. Clique em **Add** e adicione:
   - **Key:** `app.fx_rates_api_url`
   - **Value:** `https://seu-dominio.com/api/fx-rates/update`
     - Substitua `seu-dominio.com` pelo domínio real da sua aplicação
     - Exemplo: `https://app.yvebeauty.com/api/fx-rates/update`

**OU** edite a migration antes de executar e substitua a linha:
```sql
api_url := 'https://seu-dominio.com/api/fx-rates/update';
```
Pela URL real da sua aplicação.

### Passo 2: Executar Migration

1. Acesse **Supabase Dashboard** → Seu Projeto → **SQL Editor**
2. Copie todo o conteúdo de `lib/supabase/migrations/21_setup_fx_rates_cron.sql`
3. Cole no SQL Editor
4. Execute (Ctrl+Enter ou Run)
5. Verifique se não há erros

### Passo 3: Verificar Instalação

Execute no SQL Editor para verificar se o job foi criado:

```sql
SELECT * FROM cron.job WHERE jobname = 'update-fx-rates-daily';
```

Deve retornar um registro com o job configurado.

### Passo 4: Testar Manualmente (Opcional)

Para testar se está funcionando, execute:

```sql
SELECT test_update_fx_rates();
```

Deve retornar um JSON com `success: true` e as taxas atualizadas.

## Verificação Contínua

### Ver logs de execução:

```sql
SELECT 
  jobid,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-fx-rates-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

### Verificar taxas atualizadas:

```sql
SELECT 
  date,
  base,
  quote,
  rate,
  provider,
  retrieved_at
FROM fx_rate 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, base;
```

## Troubleshooting

### Problema: Extensão não disponível

Se `pg_cron` ou `http` não estiverem disponíveis no seu plano do Supabase:

1. Verifique seu plano do Supabase (alguns planos podem não ter acesso a todas as extensões)
2. Se necessário, use a alternativa com Edge Function (ver documentação adicional)

### Problema: Erro ao chamar API

Se a função retornar erro:

1. Verifique se a URL está correta
2. Teste a API manualmente: `curl https://seu-dominio.com/api/fx-rates/update`
3. Verifique se a aplicação está online
4. Verifique logs do cron job

### Problema: Job não está rodando

1. Verifique se o job está agendado:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'update-fx-rates-daily';
   ```

2. Verifique logs de execução (ver query acima)

3. Se necessário, remova e recrie:
   ```sql
   SELECT cron.unschedule('update-fx-rates-daily');
   -- Depois execute a migration novamente
   ```

## Vantagens desta Solução

✅ **Totalmente interno ao Supabase**  
✅ **Não depende de serviços externos**  
✅ **Gratuito no plano atual**  
✅ **Fácil de monitorar e depurar**  
✅ **Usa a API route existente**  

## Alternativa: Edge Function

Se `pg_cron` ou `http` não estiverem disponíveis, podemos criar uma Supabase Edge Function e agendar via `pg_cron` chamando a Edge Function. Entre em contato se precisar dessa alternativa.

