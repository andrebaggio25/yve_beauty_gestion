-- =========================
-- ADICIONA CAMPOS PHONE_COUNTRY NAS TABELAS
-- =========================

-- Tabela employee: adiciona phone_country
alter table employee 
  add column if not exists phone_country text default 'BR';

comment on column employee.phone_country is 'Código do país do telefone (pode ser diferente do country_code)';

-- Tabela customer: adiciona phone_country para contacts
-- Como contacts é JSONB, não precisamos adicionar coluna, mas vamos documentar a estrutura esperada
comment on column customer.contacts is 'Array de contatos em JSONB. Estrutura: [{name, email, phone, phone_country, role}]';

-- Índice para melhorar performance em buscas por país do telefone
create index if not exists idx_employee_phone_country on employee(phone_country) where phone is not null;

-- Função para validar formato de telefone internacional
create or replace function is_valid_international_phone(phone_number text)
returns boolean
language plpgsql
immutable
as $$
begin
  -- Verifica se começa com + e tem entre 8 e 15 dígitos
  return phone_number ~ '^\+[1-9]\d{7,14}$';
end;
$$;

comment on function is_valid_international_phone is 'Valida se um número de telefone está no formato internacional E.164';

-- Constraint para garantir formato internacional nos telefones
alter table employee
  drop constraint if exists employee_phone_format_check;

alter table employee
  add constraint employee_phone_format_check
  check (phone is null or is_valid_international_phone(phone));

-- Atualiza telefones existentes que não estejam no formato correto
-- (Apenas para dados de teste - em produção, fazer manualmente)
update employee
set phone = '+55' || regexp_replace(phone, '[^\d]', '', 'g')
where phone is not null 
  and not is_valid_international_phone(phone)
  and phone_country = 'BR';

-- Função helper para extrair código do país de um telefone
create or replace function extract_country_from_phone(phone_number text)
returns text
language plpgsql
immutable
as $$
declare
  calling_code text;
begin
  if phone_number is null or not phone_number ~ '^\+' then
    return null;
  end if;
  
  -- Extrai os primeiros dígitos após o +
  calling_code := substring(phone_number from '^\+(\d{1,4})');
  
  -- Mapeia códigos comuns para países
  case calling_code
    when '1' then return 'US';
    when '44' then return 'GB';
    when '33' then return 'FR';
    when '34' then return 'ES';
    when '39' then return 'IT';
    when '49' then return 'DE';
    when '351' then return 'PT';
    when '353' then return 'IE';
    when '52' then return 'MX';
    when '54' then return 'AR';
    when '55' then return 'BR';
    when '56' then return 'CL';
    when '57' then return 'CO';
    when '58' then return 'VE';
    else return null;
  end case;
end;
$$;

comment on function extract_country_from_phone is 'Tenta extrair o código do país de um número de telefone internacional';

-- View helper para mostrar telefones formatados
create or replace view employee_with_formatted_phone as
select 
  e.*,
  case 
    when e.phone is not null then e.phone
    else null
  end as phone_formatted,
  case
    when e.phone is not null then extract_country_from_phone(e.phone)
    else e.phone_country
  end as phone_country_detected
from employee e;

comment on view employee_with_formatted_phone is 'View que inclui telefone formatado e país detectado';

