-- =====================================================
-- Migration 21: Setup FX Rates Auto-Update com pg_cron
-- =====================================================
-- Objetivo: Configurar atualização automática diária de taxas de câmbio
-- usando pg_cron para chamar a API route existente
-- =====================================================

-- 1. Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Habilitar extensão http (necessária para fazer chamadas HTTP do PostgreSQL)
CREATE EXTENSION IF NOT EXISTS http;

-- 3. Criar função SQL que chama a API route para atualizar taxas
CREATE OR REPLACE FUNCTION update_fx_rates_from_api()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url text;
  response http_response;
  result jsonb;
BEGIN
  -- URL da API (substitua pelo seu domínio)
  -- Se estiver em desenvolvimento local, use: http://localhost:3000/api/fx-rates/update
  -- Se estiver em produção, use: https://seu-dominio.com/api/fx-rates/update
  api_url := current_setting('app.fx_rates_api_url', true);
  
  -- Se não estiver configurado, usar variável de ambiente ou padrão
  IF api_url IS NULL OR api_url = '' THEN
    -- Você pode definir isso nas configurações do Supabase
    -- Settings → Database → Custom Config → Add: app.fx_rates_api_url
    api_url := 'https://seu-dominio.com/api/fx-rates/update';
  END IF;

  -- Fazer chamada HTTP GET para a API
  SELECT * INTO response
  FROM http_get(api_url);

  -- Verificar resposta
  IF response.status = 200 THEN
    result := response.content::jsonb;
  ELSE
    RAISE EXCEPTION 'API call failed with status %: %', response.status, response.content;
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro (opcional: salvar em tabela de logs)
    RAISE WARNING 'Error updating FX rates: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Agendar job com pg_cron para rodar diariamente às 13:00 UTC (10:00 BRT)
-- Sintaxe: cron.schedule(job_name, schedule, command)
SELECT cron.schedule(
  'update-fx-rates-daily',           -- Nome do job
  '0 13 * * *',                      -- Cron: 13:00 UTC todos os dias (10:00 BRT)
  $$SELECT update_fx_rates_from_api();$$  -- Comando SQL a executar
);

-- 5. Verificar se o job foi criado
-- SELECT * FROM cron.job WHERE jobname = 'update-fx-rates-daily';

-- 6. Comentários
COMMENT ON FUNCTION update_fx_rates_from_api() IS 'Função que chama a API route para atualizar taxas de câmbio EUR-USD e BRL-USD';
COMMENT ON EXTENSION pg_cron IS 'Extensão para agendar jobs SQL periódicos';
COMMENT ON EXTENSION http IS 'Extensão para fazer requisições HTTP do PostgreSQL';

-- 7. Função auxiliar para testar manualmente
CREATE OR REPLACE FUNCTION test_update_fx_rates()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN update_fx_rates_from_api();
END;
$$;

COMMENT ON FUNCTION test_update_fx_rates() IS 'Função auxiliar para testar manualmente a atualização de taxas';

-- =====================================================
-- INSTRUÇÕES DE CONFIGURAÇÃO
-- =====================================================
-- 1. Configure a URL da API nas configurações do Supabase:
--    Settings → Database → Custom Config → Add:
--    Key: app.fx_rates_api_url
--    Value: https://seu-dominio.com/api/fx-rates/update
--
-- 2. Ou edite diretamente a função update_fx_rates_from_api()
--    e substitua 'https://seu-dominio.com/api/fx-rates/update'
--    pela URL correta da sua aplicação
--
-- 3. Para testar manualmente, execute:
--    SELECT test_update_fx_rates();
--
-- 4. Para verificar o status do cron job:
--    SELECT * FROM cron.job WHERE jobname = 'update-fx-rates-daily';
--
-- 5. Para remover o cron job (se necessário):
--    SELECT cron.unschedule('update-fx-rates-daily');
--
-- 6. Para ver logs de execução:
--    SELECT * FROM cron.job_run_details 
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-fx-rates-daily')
--    ORDER BY start_time DESC LIMIT 10;
-- =====================================================

