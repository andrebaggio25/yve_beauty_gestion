-- =====================================================
-- Migration 20: Expand Vendor Table
-- =====================================================
-- Objetivo: Expandir a tabela vendor com campos similares a customer
-- para suportar pessoa física e jurídica em cada país
-- =====================================================

-- 1. Adicionar campos básicos similares a customer
ALTER TABLE vendor 
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS state_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS tax_id_type TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_country TEXT,
  ADD COLUMN IF NOT EXISTS emails JSONB,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vendor_phone_country ON vendor(phone_country);
CREATE INDEX IF NOT EXISTS idx_vendor_country_code ON vendor(country_code);
CREATE INDEX IF NOT EXISTS idx_vendor_is_active ON vendor(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_trade_name ON vendor(trade_name);

-- 3. Tornar document_pdf_url opcional (não obrigatório como está na criação inicial)
ALTER TABLE vendor 
  ALTER COLUMN requires_invoice_pdf DROP NOT NULL;

-- 4. Adicionar constraint para validação de telefone (similar a customer)
-- A validação será feita na aplicação, mas podemos adicionar check básico
-- Remove constraint se existir e adiciona novamente
ALTER TABLE vendor 
  DROP CONSTRAINT IF EXISTS check_vendor_phone_country;
  
ALTER TABLE vendor 
  ADD CONSTRAINT check_vendor_phone_country 
  CHECK (phone_country IS NULL OR phone IS NOT NULL);

-- 5. Comentários
COMMENT ON COLUMN vendor.trade_name IS 'Nome fantasia do fornecedor';
COMMENT ON COLUMN vendor.state_code IS 'Código do estado/província';
COMMENT ON COLUMN vendor.city IS 'Cidade';
COMMENT ON COLUMN vendor.address IS 'Endereço completo';
COMMENT ON COLUMN vendor.postal_code IS 'Código postal/CEP';
COMMENT ON COLUMN vendor.tax_id_type IS 'Tipo de identificação fiscal (CNPJ, CPF, etc)';
COMMENT ON COLUMN vendor.phone IS 'Telefone internacional formatado';
COMMENT ON COLUMN vendor.phone_country IS 'País do telefone';
COMMENT ON COLUMN vendor.emails IS 'Array de emails do fornecedor (JSONB)';
COMMENT ON COLUMN vendor.website IS 'Site do fornecedor';
COMMENT ON COLUMN vendor.preferred_language IS 'Idioma preferencial (pt-BR, es-ES, en-US)';
COMMENT ON COLUMN vendor.is_active IS 'Indica se o fornecedor está ativo';

