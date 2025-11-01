# 📊 Queries SQL Úteis - Sistema de Telefone

## 🔍 Consultas de Verificação

### 1. Verificar Estrutura das Tabelas

```sql
-- Verificar campos de telefone na tabela employee
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee' 
  AND column_name IN ('phone', 'phone_country', 'country_code')
ORDER BY ordinal_position;

-- Verificar campos de telefone na tabela customer
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer' 
  AND column_name IN ('phone', 'phone_country', 'country_code')
ORDER BY ordinal_position;
```

### 2. Verificar Constraints

```sql
-- Listar constraints de telefone em employee
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'employee'
  AND constraint_name LIKE '%phone%';

-- Listar constraints de telefone em customer
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'customer'
  AND constraint_name LIKE '%phone%';
```

### 3. Verificar Índices

```sql
-- Listar índices relacionados a telefone
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('employee', 'customer')
  AND indexname LIKE '%phone%';
```

### 4. Verificar Funções

```sql
-- Listar funções relacionadas a telefone
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%phone%'
ORDER BY routine_name;
```

## 📈 Consultas de Dados

### 1. Listar Todos os Telefones

```sql
-- Funcionários com telefone
SELECT 
  id,
  first_name || ' ' || last_name AS name,
  country_code AS person_country,
  phone_country,
  phone,
  is_active
FROM employee
WHERE phone IS NOT NULL
ORDER BY created_at DESC;

-- Clientes com telefone
SELECT 
  id,
  legal_name,
  country_code AS company_country,
  phone_country,
  phone,
  is_active
FROM customer
WHERE phone IS NOT NULL
ORDER BY created_at DESC;
```

### 2. Estatísticas por País

```sql
-- Distribuição de telefones por país (employee)
SELECT 
  phone_country,
  COUNT(*) AS total,
  COUNT(CASE WHEN is_active THEN 1 END) AS active
FROM employee
WHERE phone IS NOT NULL
GROUP BY phone_country
ORDER BY total DESC;

-- Distribuição de telefones por país (customer)
SELECT 
  phone_country,
  COUNT(*) AS total,
  COUNT(CASE WHEN is_active THEN 1 END) AS active
FROM customer
WHERE phone IS NOT NULL
GROUP BY phone_country
ORDER BY total DESC;
```

### 3. Telefones com País Diferente da Pessoa

```sql
-- Funcionários com telefone de país diferente
SELECT 
  id,
  first_name || ' ' || last_name AS name,
  country_code AS person_country,
  phone_country AS phone_country,
  phone
FROM employee
WHERE phone IS NOT NULL
  AND country_code != phone_country
ORDER BY created_at DESC;

-- Clientes com telefone de país diferente
SELECT 
  id,
  legal_name,
  country_code AS company_country,
  phone_country AS phone_country,
  phone
FROM customer
WHERE phone IS NOT NULL
  AND country_code != phone_country
ORDER BY created_at DESC;
```

## ✅ Validação de Dados

### 1. Verificar Telefones Válidos

```sql
-- Contar telefones válidos vs inválidos (employee)
SELECT 
  CASE 
    WHEN is_valid_international_phone(phone) THEN 'Válido'
    ELSE 'Inválido'
  END AS status,
  COUNT(*) AS total
FROM employee
WHERE phone IS NOT NULL
GROUP BY status;

-- Contar telefones válidos vs inválidos (customer)
SELECT 
  CASE 
    WHEN is_valid_international_phone(phone) THEN 'Válido'
    ELSE 'Inválido'
  END AS status,
  COUNT(*) AS total
FROM customer
WHERE phone IS NOT NULL
GROUP BY status;
```

### 2. Listar Telefones Inválidos

```sql
-- Funcionários com telefone inválido
SELECT 
  id,
  first_name || ' ' || last_name AS name,
  phone,
  phone_country
FROM employee
WHERE phone IS NOT NULL
  AND NOT is_valid_international_phone(phone);

-- Clientes com telefone inválido
SELECT 
  id,
  legal_name,
  phone,
  phone_country
FROM customer
WHERE phone IS NOT NULL
  AND NOT is_valid_international_phone(phone);
```

### 3. Verificar País Detectado vs Armazenado

```sql
-- Comparar phone_country com país detectado do número
SELECT 
  id,
  first_name || ' ' || last_name AS name,
  phone,
  phone_country AS stored_country,
  extract_country_from_phone(phone) AS detected_country,
  CASE 
    WHEN phone_country = extract_country_from_phone(phone) THEN '✅ Match'
    ELSE '❌ Mismatch'
  END AS status
FROM employee
WHERE phone IS NOT NULL
ORDER BY status DESC, created_at DESC;
```

## 🔧 Manutenção e Correção

### 1. Corrigir Telefones Brasileiros

```sql
-- Corrigir telefones brasileiros sem +55
UPDATE employee
SET phone = '+55' || regexp_replace(phone, '[^\d]', '', 'g')
WHERE phone IS NOT NULL
  AND phone_country = 'BR'
  AND NOT phone ~ '^\+';

-- Verificar resultado
SELECT 
  id,
  first_name || ' ' || last_name AS name,
  phone,
  is_valid_international_phone(phone) AS is_valid
FROM employee
WHERE phone_country = 'BR'
  AND phone IS NOT NULL;
```

### 2. Corrigir Telefones Americanos

```sql
-- Corrigir telefones americanos sem +1
UPDATE employee
SET phone = '+1' || regexp_replace(phone, '[^\d]', '', 'g')
WHERE phone IS NOT NULL
  AND phone_country = 'US'
  AND NOT phone ~ '^\+';
```

### 3. Corrigir Telefones Espanhóis

```sql
-- Corrigir telefones espanhóis sem +34
UPDATE employee
SET phone = '+34' || regexp_replace(phone, '[^\d]', '', 'g')
WHERE phone IS NOT NULL
  AND phone_country = 'ES'
  AND NOT phone ~ '^\+';
```

### 4. Atualizar phone_country Baseado no Número

```sql
-- Atualizar phone_country para corresponder ao número
UPDATE employee
SET phone_country = extract_country_from_phone(phone)
WHERE phone IS NOT NULL
  AND extract_country_from_phone(phone) IS NOT NULL
  AND phone_country != extract_country_from_phone(phone);
```

### 5. Limpar Telefones Inválidos

```sql
-- Marcar telefones inválidos como NULL (com backup)
-- ATENÇÃO: Faça backup antes!

-- Criar tabela de backup
CREATE TABLE employee_phone_backup AS
SELECT id, phone, phone_country, created_at
FROM employee
WHERE phone IS NOT NULL;

-- Limpar telefones inválidos
UPDATE employee
SET phone = NULL
WHERE phone IS NOT NULL
  AND NOT is_valid_international_phone(phone);
```

## 📊 Relatórios

### 1. Relatório Completo de Telefones

```sql
-- Relatório detalhado de todos os telefones
SELECT 
  'Employee' AS type,
  e.id,
  e.first_name || ' ' || e.last_name AS name,
  e.country_code AS person_country,
  e.phone_country,
  e.phone,
  is_valid_international_phone(e.phone) AS is_valid,
  extract_country_from_phone(e.phone) AS detected_country,
  e.is_active,
  e.created_at
FROM employee e
WHERE e.phone IS NOT NULL

UNION ALL

SELECT 
  'Customer' AS type,
  c.id,
  c.legal_name AS name,
  c.country_code AS person_country,
  c.phone_country,
  c.phone,
  is_valid_international_phone(c.phone) AS is_valid,
  extract_country_from_phone(c.phone) AS detected_country,
  c.is_active,
  c.created_at
FROM customer c
WHERE c.phone IS NOT NULL

ORDER BY created_at DESC;
```

### 2. Relatório de Qualidade de Dados

```sql
-- Relatório de qualidade dos dados de telefone
WITH stats AS (
  SELECT 
    'Employee' AS table_name,
    COUNT(*) AS total_records,
    COUNT(phone) AS with_phone,
    COUNT(CASE WHEN is_valid_international_phone(phone) THEN 1 END) AS valid_phones,
    COUNT(CASE WHEN phone IS NOT NULL AND NOT is_valid_international_phone(phone) THEN 1 END) AS invalid_phones,
    COUNT(CASE WHEN phone_country = extract_country_from_phone(phone) THEN 1 END) AS matching_country
  FROM employee
  
  UNION ALL
  
  SELECT 
    'Customer' AS table_name,
    COUNT(*) AS total_records,
    COUNT(phone) AS with_phone,
    COUNT(CASE WHEN is_valid_international_phone(phone) THEN 1 END) AS valid_phones,
    COUNT(CASE WHEN phone IS NOT NULL AND NOT is_valid_international_phone(phone) THEN 1 END) AS invalid_phones,
    COUNT(CASE WHEN phone_country = extract_country_from_phone(phone) THEN 1 END) AS matching_country
  FROM customer
)
SELECT 
  table_name,
  total_records,
  with_phone,
  valid_phones,
  invalid_phones,
  matching_country,
  ROUND(100.0 * with_phone / NULLIF(total_records, 0), 2) AS phone_coverage_pct,
  ROUND(100.0 * valid_phones / NULLIF(with_phone, 0), 2) AS valid_phone_pct,
  ROUND(100.0 * matching_country / NULLIF(with_phone, 0), 2) AS matching_country_pct
FROM stats;
```

### 3. Top Países por Telefone

```sql
-- Top 10 países por número de telefones
SELECT 
  phone_country,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM (
  SELECT phone_country FROM employee WHERE phone IS NOT NULL
  UNION ALL
  SELECT phone_country FROM customer WHERE phone IS NOT NULL
) AS all_phones
GROUP BY phone_country
ORDER BY total DESC
LIMIT 10;
```

## 🧪 Testes

### 1. Testar Função de Validação

```sql
-- Testar is_valid_international_phone
SELECT 
  phone_number,
  is_valid_international_phone(phone_number) AS is_valid
FROM (VALUES
  ('+5511987654321'),    -- Válido BR
  ('+12345678900'),      -- Válido US
  ('+34612345678'),      -- Válido ES
  ('11987654321'),       -- Inválido (sem +)
  ('+55119876'),         -- Inválido (muito curto)
  ('+551198765432199'),  -- Inválido (muito longo)
  (NULL)                 -- NULL
) AS test_data(phone_number);
```

### 2. Testar Função de Extração de País

```sql
-- Testar extract_country_from_phone
SELECT 
  phone_number,
  extract_country_from_phone(phone_number) AS country
FROM (VALUES
  ('+5511987654321'),    -- BR
  ('+12345678900'),      -- US
  ('+34612345678'),      -- ES
  ('+351912345678'),     -- PT
  ('+353851234567'),     -- IE
  ('+4412345678'),       -- GB
  ('11987654321'),       -- NULL (sem +)
  (NULL)                 -- NULL
) AS test_data(phone_number);
```

### 3. Testar Performance

```sql
-- Testar performance de validação
EXPLAIN ANALYZE
SELECT 
  id,
  phone,
  is_valid_international_phone(phone) AS is_valid
FROM employee
WHERE phone IS NOT NULL;

-- Testar performance com índice
EXPLAIN ANALYZE
SELECT 
  id,
  phone,
  phone_country
FROM employee
WHERE phone_country = 'BR'
  AND phone IS NOT NULL;
```

## 🔄 Migrações de Dados

### 1. Migrar Telefones Antigos (Brasil)

```sql
-- Backup
CREATE TABLE employee_phone_migration_backup AS
SELECT * FROM employee WHERE phone IS NOT NULL;

-- Migração
UPDATE employee
SET 
  phone = '+55' || regexp_replace(phone, '[^\d]', '', 'g'),
  phone_country = 'BR'
WHERE phone IS NOT NULL
  AND country_code = 'BR'
  AND NOT phone ~ '^\+';

-- Verificação
SELECT 
  COUNT(*) AS total,
  COUNT(CASE WHEN is_valid_international_phone(phone) THEN 1 END) AS valid,
  COUNT(CASE WHEN NOT is_valid_international_phone(phone) THEN 1 END) AS invalid
FROM employee
WHERE phone IS NOT NULL;
```

### 2. Migrar Telefones Antigos (Múltiplos Países)

```sql
-- Migração para múltiplos países
DO $$
DECLARE
  country_rec RECORD;
  calling_code TEXT;
BEGIN
  FOR country_rec IN 
    SELECT DISTINCT country_code 
    FROM employee 
    WHERE phone IS NOT NULL 
      AND NOT phone ~ '^\+'
  LOOP
    -- Determinar calling code baseado no país
    calling_code := CASE country_rec.country_code
      WHEN 'BR' THEN '+55'
      WHEN 'US' THEN '+1'
      WHEN 'ES' THEN '+34'
      WHEN 'PT' THEN '+351'
      WHEN 'IE' THEN '+353'
      ELSE NULL
    END;
    
    IF calling_code IS NOT NULL THEN
      UPDATE employee
      SET 
        phone = calling_code || regexp_replace(phone, '[^\d]', '', 'g'),
        phone_country = country_rec.country_code
      WHERE country_code = country_rec.country_code
        AND phone IS NOT NULL
        AND NOT phone ~ '^\+';
        
      RAISE NOTICE 'Migrated phones for country: %', country_rec.country_code;
    END IF;
  END LOOP;
END $$;
```

## 📋 Manutenção Regular

### 1. Verificação Semanal

```sql
-- Query para executar semanalmente
SELECT 
  'Employee' AS table_name,
  COUNT(*) AS total_records,
  COUNT(phone) AS with_phone,
  COUNT(CASE WHEN is_valid_international_phone(phone) THEN 1 END) AS valid_phones,
  COUNT(CASE WHEN phone IS NOT NULL AND NOT is_valid_international_phone(phone) THEN 1 END) AS invalid_phones
FROM employee

UNION ALL

SELECT 
  'Customer' AS table_name,
  COUNT(*) AS total_records,
  COUNT(phone) AS with_phone,
  COUNT(CASE WHEN is_valid_international_phone(phone) THEN 1 END) AS valid_phones,
  COUNT(CASE WHEN phone IS NOT NULL AND NOT is_valid_international_phone(phone) THEN 1 END) AS invalid_phones
FROM customer;
```

### 2. Limpeza Mensal

```sql
-- Identificar registros para limpeza
SELECT 
  'Employee' AS type,
  id,
  first_name || ' ' || last_name AS name,
  phone,
  phone_country,
  created_at
FROM employee
WHERE phone IS NOT NULL
  AND NOT is_valid_international_phone(phone)
  AND created_at < NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Customer' AS type,
  id,
  legal_name AS name,
  phone,
  phone_country,
  created_at
FROM customer
WHERE phone IS NOT NULL
  AND NOT is_valid_international_phone(phone)
  AND created_at < NOW() - INTERVAL '30 days';
```

## 🎯 Queries Úteis para Desenvolvimento

### 1. Criar Dados de Teste

```sql
-- Inserir funcionários de teste com telefones de diferentes países
INSERT INTO employee (
  branch_id,
  first_name,
  last_name,
  email,
  phone,
  phone_country,
  country_code,
  contract_type,
  start_date,
  is_active
) VALUES
  -- Brasileiro com telefone brasileiro
  ((SELECT id FROM branch LIMIT 1), 'João', 'Silva', 'joao@test.com', '+5511987654321', 'BR', 'BR', 'fixed', CURRENT_DATE, true),
  
  -- Brasileiro com telefone americano
  ((SELECT id FROM branch LIMIT 1), 'Maria', 'Santos', 'maria@test.com', '+12345678900', 'US', 'BR', 'fixed', CURRENT_DATE, true),
  
  -- Espanhol com telefone espanhol
  ((SELECT id FROM branch LIMIT 1), 'Pedro', 'García', 'pedro@test.com', '+34612345678', 'ES', 'ES', 'fixed', CURRENT_DATE, true),
  
  -- Português com telefone português
  ((SELECT id FROM branch LIMIT 1), 'Ana', 'Costa', 'ana@test.com', '+351912345678', 'PT', 'PT', 'fixed', CURRENT_DATE, true),
  
  -- Irlandês com telefone irlandês
  ((SELECT id FROM branch LIMIT 1), 'John', 'O\'Brien', 'john@test.com', '+353851234567', 'IE', 'IE', 'fixed', CURRENT_DATE, true);
```

### 2. Limpar Dados de Teste

```sql
-- Remover funcionários de teste
DELETE FROM employee
WHERE email LIKE '%@test.com';
```

---

**Data de Criação**: 2025-11-01  
**Versão**: 1.0.0  
**Autor**: Sistema de Gestão Yve Beauty

