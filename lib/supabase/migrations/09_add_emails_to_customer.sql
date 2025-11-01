-- =========================
-- ADICIONA SUPORTE A MÚLTIPLOS E-MAILS NA TABELA CUSTOMER
-- =========================

-- Adiciona campo emails como JSONB para armazenar array de e-mails
alter table customer
  add column if not exists emails jsonb default '[]'::jsonb;

comment on column customer.emails is 'Array de e-mails do cliente em JSONB. Estrutura: ["email1@example.com", "email2@example.com"]';

-- Índice GIN para busca eficiente em JSONB
create index if not exists idx_customer_emails_gin on customer using gin(emails);

-- Função para validar array de e-mails
create or replace function validate_emails_array(emails_json jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  email_item text;
begin
  -- Verifica se é um array
  if jsonb_typeof(emails_json) != 'array' then
    return false;
  end if;
  
  -- Valida cada e-mail no array
  for email_item in select jsonb_array_elements_text(emails_json)
  loop
    -- Validação básica de e-mail
    if not email_item ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
      return false;
    end if;
  end loop;
  
  return true;
end;
$$;

comment on function validate_emails_array is 'Valida se um JSONB contém um array válido de e-mails';

-- Constraint para validar o array de e-mails
alter table customer
  drop constraint if exists customer_emails_valid_check;

alter table customer
  add constraint customer_emails_valid_check
  check (emails is null or validate_emails_array(emails));

-- Migra e-mail existente para o array de e-mails
update customer
set emails = jsonb_build_array(email)
where email is not null
  and email != ''
  and (emails is null or emails = '[]'::jsonb);

-- View helper para trabalhar com e-mails
create or replace view customer_with_emails as
select 
  c.*,
  case 
    when jsonb_array_length(c.emails) > 0 then 
      c.emails->0
    else 
      null
  end as primary_email,
  case 
    when jsonb_array_length(c.emails) > 1 then 
      jsonb_array_length(c.emails) - 1
    else 
      0
  end as additional_emails_count
from customer c;

comment on view customer_with_emails is 'View que inclui e-mail principal e contagem de e-mails adicionais';

-- Função helper para obter e-mail principal
create or replace function get_primary_email(emails_json jsonb)
returns text
language plpgsql
immutable
as $$
begin
  if emails_json is null or jsonb_array_length(emails_json) = 0 then
    return null;
  end if;
  
  return emails_json->>0;
end;
$$;

comment on function get_primary_email is 'Retorna o e-mail principal (primeiro do array)';

-- Função helper para obter e-mails secundários
create or replace function get_secondary_emails(emails_json jsonb)
returns jsonb
language plpgsql
immutable
as $$
begin
  if emails_json is null or jsonb_array_length(emails_json) <= 1 then
    return '[]'::jsonb;
  end if;
  
  return emails_json - 0;
end;
$$;

comment on function get_secondary_emails is 'Retorna os e-mails secundários (todos exceto o primeiro)';

