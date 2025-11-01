# Aplicar Migration 12 - Payment Method Table Update

## Problema Identificado

A página de Métodos de Pagamento está apresentando o erro:
```
"code": "42703",
"message": "column payment_method.name does not exist"
```

Isso ocorre porque a estrutura da tabela `payment_method` no banco de dados não corresponde ao que o código da aplicação espera.

## Estrutura Atual (Banco de Dados)

```sql
payment_method (
  id uuid,
  branch_id uuid,
  code text,
  active boolean,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
```

## Estrutura Esperada (Aplicação)

```typescript
interface PaymentMethod {
  id: string
  name: string
  type: 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'boleto' | 'check' | 'other'
  is_active: boolean
  requires_approval: boolean
  default_account_id: string | null
  created_at: string
}
```

## Solução

A migration `12_update_payment_method_table.sql` faz o seguinte:

1. ✅ Cria o tipo enum `payment_method_type` com os tipos suportados
2. ✅ Adiciona as novas colunas: `name`, `type`, `is_active`, `requires_approval`, `default_account_id`
3. ✅ Migra os dados existentes do campo `code` para `name` e `type`
4. ✅ Migra o campo `active` para `is_active`
5. ✅ Torna as novas colunas obrigatórias
6. ✅ Atualiza os índices da tabela
7. ✅ Mantém os campos antigos (`code`, `active`) para compatibilidade

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `lib/supabase/migrations/12_update_payment_method_table.sql`
6. Cole no editor
7. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)
8. Verifique se a execução foi bem-sucedida (deve aparecer "Success. No rows returned")

### Opção 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Na raiz do projeto
supabase db push
```

Ou aplique manualmente:

```bash
# Conecte-se ao banco de dados
psql "sua-connection-string-aqui"

# Execute o arquivo
\i lib/supabase/migrations/12_update_payment_method_table.sql
```

### Opção 3: Via psql Direto

```bash
# Substitua pelos seus dados de conexão
psql -h db.your-project.supabase.co \
     -p 5432 \
     -d postgres \
     -U postgres \
     -f lib/supabase/migrations/12_update_payment_method_table.sql
```

## Verificação

Após aplicar a migration, execute estas queries para verificar:

### 1. Verificar estrutura da tabela

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payment_method'
ORDER BY ordinal_position;
```

Você deve ver as colunas:
- `id`, `branch_id`, `name`, `type`, `is_active`, `requires_approval`, `default_account_id`, `code`, `active`, `metadata`, `created_at`, `updated_at`

### 2. Verificar dados migrados

```sql
SELECT 
  id,
  name,
  type,
  is_active,
  requires_approval,
  code,
  active
FROM payment_method;
```

Os dados antigos devem ter sido migrados corretamente.

### 3. Verificar índices

```sql
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'payment_method';
```

Deve mostrar os novos índices:
- `uq_payment_method_name` (unique)
- `idx_payment_method_type`
- `idx_payment_method_active`

## Teste na Aplicação

Após aplicar a migration:

1. Acesse a aplicação
2. Vá em **Configurações** → **Métodos de Pagamento**
3. A página deve carregar sem erros
4. Você deve ver os métodos de pagamento existentes
5. Teste criar um novo método de pagamento
6. Teste editar um método existente
7. Teste ativar/desativar um método

## Rollback (Se Necessário)

Se algo der errado, você pode reverter com:

```sql
-- Remover novas colunas
ALTER TABLE payment_method 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS requires_approval,
  DROP COLUMN IF EXISTS default_account_id;

-- Remover tipo enum
DROP TYPE IF EXISTS payment_method_type;

-- Recriar índice antigo
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_method 
  ON payment_method(branch_id, code);
```

## Notas Importantes

1. ⚠️ **Backup**: Sempre faça backup do banco antes de aplicar migrations em produção
2. ⚠️ **Dados Existentes**: A migration preserva os dados existentes migrando-os automaticamente
3. ✅ **Compatibilidade**: Os campos antigos (`code`, `active`) são mantidos para compatibilidade
4. ✅ **Sem Downtime**: A migration pode ser aplicada sem parar a aplicação
5. 📝 **Documentação**: Os campos foram documentados com comentários SQL

## Próximos Passos

Após aplicar esta migration com sucesso:

1. ✅ Testar a página de Métodos de Pagamento
2. ✅ Verificar se outros módulos que usam `payment_method` funcionam corretamente
3. ✅ Considerar remover os campos legados (`code`, `active`) em uma migration futura
4. ✅ Atualizar documentação do sistema

## Suporte

Se encontrar problemas:

1. Verifique os logs do Supabase
2. Execute as queries de verificação acima
3. Verifique se há constraints ou triggers que possam estar interferindo
4. Considere fazer rollback e revisar a migration

---

**Data de Criação**: 2025-11-01  
**Versão da Migration**: 12  
**Status**: Pronta para aplicar

