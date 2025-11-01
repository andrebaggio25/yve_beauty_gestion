-- =========================
-- CRIAÇÃO DA TABELA EMPLOYEE
-- =========================

-- Enum para tipos de contrato
do $$ begin
  if not exists (select 1 from pg_type where typname='contract_type') then
    create type contract_type as enum ('fixed','temporary','intern','contractor');
  end if;
end $$;

-- Tabela de funcionários
create table if not exists employee (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  user_profile_id uuid references user_profile(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  phone_country text default 'BR',
  country_code text,
  tax_id text,
  contract_type contract_type not null default 'contractor',
  contract_value numeric(18,2),
  contract_currency text references currency(code),
  payment_day int check (payment_day >= 1 and payment_day <= 31),
  start_date date,
  end_date date,
  is_active boolean not null default true,
  address jsonb,
  documents jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Índices
create index if not exists idx_employee_branch on employee(branch_id);
create index if not exists idx_employee_email on employee(email);
create index if not exists idx_employee_active on employee(is_active);

-- Triggers
create trigger trg_employee_ts 
  before update on employee 
  for each row 
  execute function trg_set_timestamp();

create trigger trg_employee_audit 
  after insert or update or delete on employee 
  for each row 
  execute function audit_row_change();

-- RLS
alter table employee enable row level security;

create policy all_employee on employee
for all using (
  exists(select 1 from branch b where b.id=employee.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=employee.branch_id and b.company_id=jwt_company_id())
);

-- Comentários
comment on table employee is 'Cadastro de funcionários e terceiros';
comment on column employee.contract_type is 'Tipo de contrato: fixed, temporary, intern, contractor';
comment on column employee.contract_value is 'Valor mensal do contrato (para gerar provisões)';
comment on column employee.payment_day is 'Dia do mês para pagamento (1-31)';

