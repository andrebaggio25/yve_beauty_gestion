# Alternativa: Edge Function do Supabase

Se a extensão `http` ou `pg_cron` não estiverem disponíveis no seu plano, esta é uma alternativa usando Supabase Edge Functions.

## Como Funciona

1. Criar Edge Function que atualiza as taxas
2. Criar função SQL que chama a Edge Function via `supabase_functions.invoke()`
3. Agendar com `pg_cron`

## Passo a Passo

### 1. Criar Edge Function

Crie o arquivo `supabase/functions/update-fx-rates/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXCHANGE_RATE_API_KEY = Deno.env.get('EXCHANGE_RATE_API_KEY') || 'demo'
const BASE_URL = 'https://v6.exchangerate-api.com/v6'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0]

    // Verificar se já atualizou hoje
    const { data: existingRates } = await supabase
      .from('fx_rate')
      .select('date, base, quote')
      .eq('date', today)
      .in('base', ['EUR', 'BRL'])
      .eq('quote', 'USD')

    if (existingRates && existingRates.length >= 2) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Taxas já atualizadas hoje',
          date: today,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar taxas da API
    const response = await fetch(`${BASE_URL}/${EXCHANGE_RATE_API_KEY}/latest/USD`)
    const data = await response.json()

    if (data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates')
    }

    const rates = data.conversion_rates
    const eurToUsd = 1 / rates.EUR
    const brlToUsd = 1 / rates.BRL

    // Salvar no banco
    const { error } = await supabase
      .from('fx_rate')
      .upsert([
        {
          date: today,
          base: 'EUR',
          quote: 'USD',
          rate: eurToUsd,
          provider: 'exchangerate-api.com',
        },
        {
          date: today,
          base: 'BRL',
          quote: 'USD',
          rate: brlToUsd,
          provider: 'exchangerate-api.com',
        },
      ], {
        onConflict: 'date,base,quote',
      })

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Taxas atualizadas com sucesso',
        date: today,
        rates: { EUR: eurToUsd, BRL: brlToUsd },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 2. Deploy da Edge Function

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Deploy
supabase functions deploy update-fx-rates
```

### 3. Criar Migration SQL

Crie uma migration que agende a Edge Function:

```sql
-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Função que chama a Edge Function
CREATE OR REPLACE FUNCTION update_fx_rates_via_edge_function()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Chamar Edge Function
  SELECT content::jsonb INTO result
  FROM http((
    'POST',
    current_setting('app.supabase_url', true) || '/functions/v1/update-fx-rates',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true))
    ],
    'application/json',
    '{}'
  )::http_request);

  RETURN result;
END;
$$;

-- Agendar
SELECT cron.schedule(
  'update-fx-rates-daily',
  '0 13 * * *',
  $$SELECT update_fx_rates_via_edge_function();$$
);
```

## Quando Usar Esta Alternativa

- Se `http` extension não estiver disponível
- Se preferir manter lógica complexa em TypeScript
- Se quiser mais controle sobre a lógica de atualização

**Nota:** A Migration 21 usa a abordagem mais simples (chama API route diretamente), que é recomendada se disponível.

