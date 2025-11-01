-- =========================
-- ATUALIZA ESTRUTURA DA TABELA CUSTOMER
-- =========================
-- Esta migration adiciona campos que estão sendo usados no código TypeScript
-- mas não existem na tabela customer original

-- Adiciona campos de endereço
alter table customer
  add column if not exists state_code text;

alter table customer
  add column if not exists city text;

alter table customer
  add column if not exists address text;

alter table customer
  add column if not exists postal_code text;

-- Adiciona campo tax_id_type
do $$ begin
  if not exists (select 1 from pg_type where typname='tax_id_type') then
    create type tax_id_type as enum ('EIN', 'VAT', 'NIF', 'CNPJ', 'OTHER');
  end if;
end $$;

alter table customer
  add column if not exists tax_id_type tax_id_type default 'OTHER';

-- Adiciona preferred_language
alter table customer
  add column if not exists preferred_language text default 'pt-BR';

-- Adiciona constraint para preferred_language
alter table customer
  drop constraint if exists customer_preferred_language_check;

alter table customer
  add constraint customer_preferred_language_check
  check (preferred_language in ('pt-BR', 'es-ES', 'en-US'));

-- Renomeia branch_id para company_id se necessário (para compatibilidade com o código)
-- Nota: Se você usa branch_id, mantenha assim. Se usa company_id, descomente abaixo:
-- alter table customer rename column branch_id to company_id;

-- Comments para documentação
comment on column customer.state_code is 'Código do estado/província';
comment on column customer.city is 'Cidade';
comment on column customer.address is 'Endereço completo';
comment on column customer.postal_code is 'Código postal/CEP';
comment on column customer.tax_id_type is 'Tipo de identificação fiscal';
comment on column customer.preferred_language is 'Idioma preferido do cliente';

-- Índices adicionais
create index if not exists idx_customer_country on customer(country_code);
create index if not exists idx_customer_state on customer(state_code) where state_code is not null;
create index if not exists idx_customer_city on customer(city) where city is not null;
create index if not exists idx_customer_tax_id on customer(tax_id) where tax_id is not null;

-- Atualiza registros existentes com valores padrão se necessário
update customer
set 
  preferred_language = 'pt-BR',
  is_active = true,
  tax_id_type = 'OTHER'
where preferred_language is null
   or is_active is null
   or tax_id_type is null;

