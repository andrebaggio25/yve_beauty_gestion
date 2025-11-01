# Como Aplicar a Migration da Tabela Employee

## Problema Identificado

A tabela `employee` não existe no banco de dados, causando erro 404 na tela de funcionários.

## Solução

Foi criada a migration `05_create_employee_table.sql` que cria:

1. **Enum `contract_type`**: Para tipos de contrato (fixed, temporary, intern, contractor)
2. **Tabela `employee`**: Com todos os campos necessários
3. **Índices**: Para otimizar consultas
4. **Triggers**: Para auditoria e timestamps
5. **RLS Policies**: Para segurança por empresa

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `lib/supabase/migrations/05_create_employee_table.sql`
6. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 2: Via CLI do Supabase

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

### Opção 3: Via psql (Direto no PostgreSQL)

```bash
psql "postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres" \
  -f lib/supabase/migrations/05_create_employee_table.sql
```

## Estrutura da Tabela Employee

```sql
employee (
  id uuid PRIMARY KEY,
  branch_id uuid NOT NULL,
  user_profile_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country_code text,
  tax_id text,
  contract_type contract_type NOT NULL DEFAULT 'contractor',
  contract_value numeric(18,2),
  contract_currency text,
  payment_day int,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  address jsonb,
  documents jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
)
```

## Tipos de Contrato

- `fixed` - Fixo
- `temporary` - Temporário
- `intern` - Estagiário
- `contractor` - Terceiro (PJ)

## Verificação

Após aplicar a migration, você pode verificar se funcionou:

```sql
-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'employee';

-- Verificar estrutura
\d employee

-- Testar inserção
INSERT INTO employee (
  branch_id, 
  first_name, 
  last_name, 
  email, 
  contract_type
) VALUES (
  (SELECT id FROM branch LIMIT 1),
  'João',
  'Silva',
  'joao.silva@example.com',
  'contractor'
);
```

## Próximos Passos

Após aplicar a migration:

1. ✅ A tela de funcionários deve carregar sem erros
2. ✅ Você poderá criar novos funcionários
3. ✅ As provisões automáticas poderão ser vinculadas a funcionários

## Observações

- A tabela já vem com RLS (Row Level Security) habilitado
- Apenas usuários da mesma empresa podem ver os funcionários
- Os triggers de auditoria estão ativos
- A tabela suporta dados em JSONB para endereços e documentos (flexibilidade)

