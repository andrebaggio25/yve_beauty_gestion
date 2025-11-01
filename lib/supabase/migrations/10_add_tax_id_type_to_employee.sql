-- =========================
-- ADICIONA TAX_ID_TYPE NA TABELA EMPLOYEE
-- =========================

-- Adiciona campo tax_id_type
alter table employee
  add column if not exists tax_id_type text;

comment on column employee.tax_id_type is 'Tipo de identificação fiscal (CPF, CNPJ, EIN, VAT, etc.) - dinâmico por país';

-- Índice para melhorar performance
create index if not exists idx_employee_tax_id_type on employee(tax_id_type) where tax_id_type is not null;

