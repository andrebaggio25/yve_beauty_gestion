-- =====================================================
-- Migration 15: Update Company Table Fields
-- =====================================================
-- Objetivo: Adicionar campos faltantes na tabela company
-- para suportar telefone internacional, tax_id_type e outros campos
-- =====================================================

-- 1. Adicionar campos faltantes na tabela company
-- (Alguns campos podem já existir da migration 02, mas garantimos com IF NOT EXISTS)
ALTER TABLE company 
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS tax_id_type TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_country TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Criar constraint para tax_id_type
DO $$ BEGIN
  CREATE TYPE tax_id_type_enum AS ENUM ('EIN', 'VAT', 'NIF', 'CNPJ', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Se o campo tax_id_type já existe como TEXT, podemos converter
-- (mas vamos manter como TEXT por compatibilidade por enquanto)

-- 4. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_company_country_code ON company(country_code);
CREATE INDEX IF NOT EXISTS idx_company_tax_id ON company(tax_id);
CREATE INDEX IF NOT EXISTS idx_company_email ON company(email);

-- 5. Adicionar comentários
COMMENT ON COLUMN company.trade_name IS 'Nome fantasia da empresa';
COMMENT ON COLUMN company.tax_id IS 'CNPJ/Tax ID da empresa';
COMMENT ON COLUMN company.tax_id_type IS 'Tipo de identificação fiscal (EIN, VAT, NIF, CNPJ, OTHER)';
COMMENT ON COLUMN company.email IS 'Email de contato da empresa';
COMMENT ON COLUMN company.phone IS 'Telefone no formato internacional (E.164)';
COMMENT ON COLUMN company.phone_country IS 'Código do país do telefone (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN company.website IS 'Website da empresa';
COMMENT ON COLUMN company.address_line1 IS 'Endereço linha 1';
COMMENT ON COLUMN company.address_line2 IS 'Endereço linha 2 (complemento)';
COMMENT ON COLUMN company.city IS 'Cidade';
COMMENT ON COLUMN company.state IS 'Estado/Província';
COMMENT ON COLUMN company.postal_code IS 'CEP/Código postal';
COMMENT ON COLUMN company.logo_url IS 'URL do logo da empresa (armazenado no Supabase Storage)';

-- 6. Migrar dados existentes (se houver)
-- Se a tabela já tiver dados no campo 'name', podemos usar como legal_name
-- e se tiver 'ein', pode ser usado como tax_id

-- 7. Adicionar constraint de validação para phone (formato E.164)
-- Usa a mesma função criada nas migrations anteriores
ALTER TABLE company 
  ADD CONSTRAINT company_phone_format_check 
  CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{7,14}$');

-- 8. Adicionar constraint para phone_country
ALTER TABLE company 
  ADD CONSTRAINT company_phone_country_check 
  CHECK (phone_country IS NULL OR LENGTH(phone_country) = 2);

-- =====================================================
-- Verificação
-- =====================================================
-- Execute estas queries para verificar:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'company'
-- ORDER BY ordinal_position;
--
-- =====================================================

