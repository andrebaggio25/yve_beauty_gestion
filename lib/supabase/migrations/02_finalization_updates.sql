-- =========================
-- FINALIZATION SCHEMA UPDATES
-- Date: October 2025
-- Description: Add missing fields for 100% system completion
-- =========================

-- 1. Update Company Table - Add all missing fields for company profile and invoicing
ALTER TABLE company ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS trade_name text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brasil';
ALTER TABLE company ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Add payment details to company table for invoice generation
ALTER TABLE company ADD COLUMN IF NOT EXISTS bank_account_holder text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS iban text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS bic_swift text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE company ADD COLUMN IF NOT EXISTS bank_address text;

-- 3. Update Accounts Payable - Add description field
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT 'Conta a pagar';
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS fx_rate_source text;
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS fx_rate_timestamp timestamptz;

-- 4. Update Accounts Receivable - Add description field
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT 'Conta a receber';
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS fx_rate_source text;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS fx_rate_timestamp timestamptz;

-- 5. Ensure Invoice table has notes field for additional information
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS notes text;

-- 6. Create indexes for better performance on financial queries
CREATE INDEX IF NOT EXISTS idx_accounts_payable_currency ON accounts_payable(currency_code);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_currency ON accounts_receivable(currency_code);
CREATE INDEX IF NOT EXISTS idx_invoice_currency ON invoice(currency_code);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);

-- 7. Comments for documentation
COMMENT ON COLUMN company.logo_url IS 'URL to company logo stored in Supabase Storage';
COMMENT ON COLUMN company.bank_account_holder IS 'Account holder name for invoice payments';
COMMENT ON COLUMN company.iban IS 'International Bank Account Number for invoice payments';
COMMENT ON COLUMN company.bic_swift IS 'BIC/SWIFT code for invoice payments';
COMMENT ON COLUMN accounts_payable.description IS 'Description of the payable account';
COMMENT ON COLUMN accounts_receivable.description IS 'Description of the receivable account';
COMMENT ON COLUMN invoice.notes IS 'Additional notes or instructions for the invoice';

-- 8. Update existing records to have default descriptions
UPDATE accounts_payable SET description = 'Conta a pagar' WHERE description = '' OR description IS NULL;
UPDATE accounts_receivable SET description = 'Conta a receber' WHERE description = '' OR description IS NULL;

