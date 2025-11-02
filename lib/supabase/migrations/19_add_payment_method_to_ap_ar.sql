-- =====================================================
-- Migration 19: Add payment_method_id to accounts_payable and accounts_receivable
-- =====================================================
-- Objetivo: Adicionar campo payment_method_id nas tabelas de contas a pagar e receber
-- =====================================================

-- 1. Adicionar payment_method_id em accounts_payable
ALTER TABLE accounts_payable 
  ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_method(id) ON DELETE SET NULL;

-- 2. Adicionar payment_method_id em accounts_receivable
ALTER TABLE accounts_receivable 
  ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_method(id) ON DELETE SET NULL;

-- 3. Criar índices para melhor performance (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_ap_payment_method ON accounts_payable(payment_method_id) WHERE payment_method_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ar_payment_method ON accounts_receivable(payment_method_id) WHERE payment_method_id IS NOT NULL;

-- 4. Comentários
COMMENT ON COLUMN accounts_payable.payment_method_id IS 'Método de pagamento preferencial para esta conta a pagar';
COMMENT ON COLUMN accounts_receivable.payment_method_id IS 'Método de pagamento preferencial para esta conta a receber';

