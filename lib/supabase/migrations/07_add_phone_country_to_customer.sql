-- =========================
-- ADICIONA PHONE E PHONE_COUNTRY NA TABELA CUSTOMER
-- =========================

-- Adiciona campo phone na tabela customer (se não existir)
alter table customer 
  add column if not exists phone text;

-- Adiciona phone_country na tabela customer
alter table customer 
  add column if not exists phone_country text default 'BR';

-- Adiciona outros campos úteis para customer
alter table customer
  add column if not exists email text;

alter table customer
  add column if not exists website text;

alter table customer
  add column if not exists is_active boolean not null default true;

comment on column customer.phone is 'Telefone principal no formato E.164 (ex: +5511987654321)';
comment on column customer.phone_country is 'Código do país do telefone principal (pode ser diferente do country_code)';
comment on column customer.email is 'Email principal do cliente';
comment on column customer.website is 'Website do cliente';
comment on column customer.is_active is 'Cliente ativo no sistema';

-- Constraint para garantir formato internacional nos telefones do customer
alter table customer
  drop constraint if exists customer_phone_format_check;

alter table customer
  add constraint customer_phone_format_check
  check (phone is null or is_valid_international_phone(phone));

-- Índice para melhorar performance
create index if not exists idx_customer_phone_country on customer(phone_country) where phone is not null;
create index if not exists idx_customer_email on customer(email) where email is not null;
create index if not exists idx_customer_active on customer(is_active);

-- Atualiza telefones existentes que não estejam no formato correto
-- (Apenas para dados de teste - em produção, fazer manualmente)
update customer
set phone = '+55' || regexp_replace(phone, '[^\d]', '', 'g')
where phone is not null 
  and not is_valid_international_phone(phone)
  and phone_country = 'BR';

