# 🔧 Correção: Erro na Página de Métodos de Pagamento

## 🐛 Problema Identificado

**Erro**: 
```json
{
  "code": "42703",
  "details": null,
  "hint": null,
  "message": "column payment_method.name does not exist"
}
```

**Localização**: Página de Métodos de Pagamento (`/settings/payment-methods`)

## 🔍 Análise do Problema

### Estrutura Atual no Banco de Dados

A tabela `payment_method` foi criada na migration inicial (`01_migration_inicial.sql`) com a seguinte estrutura:

```sql
CREATE TABLE payment_method (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
  code text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);
```

### Estrutura Esperada pela Aplicação

O código da página (`app/(dashboard)/settings/payment-methods/page.tsx`) espera:

```typescript
interface PaymentMethod {
  id: string
  name: string                    // ❌ NÃO EXISTE
  type: 'bank_transfer' | ...     // ❌ NÃO EXISTE
  is_active: boolean              // ❌ NÃO EXISTE (existe 'active')
  requires_approval: boolean      // ❌ NÃO EXISTE
  default_account_id: string | null // ❌ NÃO EXISTE
  created_at: string
}
```

### Causa Raiz

Há uma **incompatibilidade entre a estrutura do banco de dados e o código da aplicação**. A tabela foi criada com uma estrutura simplificada (`code`, `active`), mas o código espera uma estrutura mais completa (`name`, `type`, `is_active`, `requires_approval`).

## ✅ Solução Implementada

### Migration 12: Update Payment Method Table

Criada a migration `lib/supabase/migrations/12_update_payment_method_table.sql` que:

1. **Cria enum para tipos de pagamento**:
```sql
CREATE TYPE payment_method_type AS ENUM (
  'bank_transfer', 'credit_card', 'debit_card', 
  'cash', 'pix', 'boleto', 'check', 'other'
);
```

2. **Adiciona novas colunas**:
   - `name` (text, NOT NULL)
   - `type` (payment_method_type, NOT NULL)
   - `is_active` (boolean, NOT NULL, default true)
   - `requires_approval` (boolean, NOT NULL, default false)
   - `default_account_id` (uuid, nullable, FK para bank_account)

3. **Migra dados existentes**:
   - Converte `code` → `name` (com labels amigáveis)
   - Converte `code` → `type` (com mapeamento para enum)
   - Converte `active` → `is_active`

4. **Atualiza índices**:
   - Remove: `uq_payment_method` (baseado em code)
   - Adiciona: `uq_payment_method_name` (baseado em name)
   - Adiciona: `idx_payment_method_type`
   - Adiciona: `idx_payment_method_active`

5. **Mantém compatibilidade**:
   - Campos antigos (`code`, `active`) são mantidos
   - Permite migração gradual se necessário

### Mapeamento de Dados

| code (antigo) | name (novo) | type (novo) |
|---------------|-------------|-------------|
| wire | Transferência Bancária | bank_transfer |
| stripe | Cartão de Crédito (Stripe) | credit_card |
| pix | PIX | pix |
| cash | Dinheiro | cash |
| boleto | Boleto | boleto |
| check | Cheque | check |
| outros | INITCAP(code) | other |

## 📋 Como Aplicar a Correção

### Passo 1: Aplicar a Migration

**Via Supabase Dashboard** (Recomendado):

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie o conteúdo de `lib/supabase/migrations/12_update_payment_method_table.sql`
6. Cole no editor
7. Clique em **Run**
8. Verifique se aparece "Success. No rows returned"

**Via CLI**:
```bash
supabase db push
```

### Passo 2: Verificar a Aplicação

Execute esta query para confirmar:

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

Deve mostrar as novas colunas: `name`, `type`, `is_active`, `requires_approval`, `default_account_id`.

### Passo 3: Testar na Aplicação

1. Acesse a aplicação
2. Vá em **Configurações** → **Métodos de Pagamento**
3. A página deve carregar sem erros
4. Você deve ver os métodos existentes migrados
5. Teste criar um novo método
6. Teste editar um método existente
7. Teste ativar/desativar métodos

## 🎯 Resultado Esperado

Após aplicar a migration:

✅ A página de Métodos de Pagamento carrega sem erros  
✅ Métodos existentes são exibidos corretamente  
✅ É possível criar novos métodos  
✅ É possível editar métodos existentes  
✅ É possível ativar/desativar métodos  
✅ Dados antigos são preservados e migrados  
✅ Compatibilidade com código legado mantida  

## 📚 Arquivos Relacionados

### Arquivos Criados/Modificados

1. **Migration**:
   - `lib/supabase/migrations/12_update_payment_method_table.sql` (NOVO)

2. **Documentação**:
   - `APLICAR_MIGRATION_PAYMENT_METHOD.md` (NOVO)
   - `ORDEM_APLICACAO_MIGRATIONS.md` (ATUALIZADO)
   - `CORRECAO_PAYMENT_METHOD.md` (NOVO - este arquivo)

3. **Código da Aplicação** (não modificado):
   - `app/(dashboard)/settings/payment-methods/page.tsx`

### Nenhuma Mudança no Código Necessária

✅ O código da aplicação **NÃO precisa ser modificado**  
✅ A migration adapta o banco de dados ao código existente  
✅ Abordagem de migração forward-compatible  

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

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

## ⚠️ Considerações Importantes

1. **Backup**: Sempre faça backup antes de aplicar em produção
2. **Ambiente de Teste**: Teste primeiro em desenvolvimento
3. **Dados Existentes**: A migration preserva todos os dados
4. **Sem Downtime**: Pode ser aplicada sem parar a aplicação
5. **Campos Legados**: `code` e `active` são mantidos para compatibilidade

## 🎓 Lições Aprendidas

### Problema Identificado

Este erro ocorreu porque:

1. A migration inicial criou uma estrutura simplificada
2. O código da aplicação foi desenvolvido esperando uma estrutura mais completa
3. Não houve sincronização entre schema do banco e interfaces TypeScript

### Prevenção Futura

Para evitar problemas similares:

1. ✅ Sempre sincronizar schema do banco com interfaces TypeScript
2. ✅ Criar migrations antes de desenvolver features que dependem delas
3. ✅ Documentar estrutura de tabelas no código
4. ✅ Usar ferramentas de geração de tipos (ex: supabase gen types)
5. ✅ Testar em ambiente local antes de deploy

### Boas Práticas Aplicadas

1. ✅ Migration com migração de dados automática
2. ✅ Manutenção de campos legados para compatibilidade
3. ✅ Documentação completa da mudança
4. ✅ Queries de verificação incluídas
5. ✅ Rollback documentado

## 📊 Status

- [x] Problema identificado
- [x] Causa raiz analisada
- [x] Migration criada
- [x] Documentação completa
- [x] Queries de verificação preparadas
- [x] Rollback documentado
- [ ] Migration aplicada (aguardando aplicação)
- [ ] Teste em produção

## 📞 Próximos Passos

1. **Aplicar a migration** no banco de dados
2. **Verificar** que a estrutura está correta
3. **Testar** a página de Métodos de Pagamento
4. **Confirmar** que não há outros erros relacionados
5. **Documentar** o sucesso da aplicação

---

**Data**: 2025-11-01  
**Versão da Migration**: 12  
**Status**: Pronta para aplicar  
**Prioridade**: Alta (página não funcional)

