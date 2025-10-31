-- =========================
-- 0) EXTENSÕES
-- =========================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================
-- 1) ENUMS & SEQUENCES
-- =========================
do $$ begin
  if not exists (select 1 from pg_type where typname='permission_action') then
    create type permission_action as enum ('view','create','edit','delete','approve','export','send');
  end if;
  if not exists (select 1 from pg_type where typname='contract_billing_model') then
    create type contract_billing_model as enum ('unique','recurring');
  end if;
  if not exists (select 1 from pg_type where typname='contract_recognition') then
    create type contract_recognition as enum ('competencia','vigencia');
  end if;
  if not exists (select 1 from pg_type where typname='recurrence_type') then
    create type recurrence_type as enum ('none','monthly','quarterly');
  end if;
  if not exists (select 1 from pg_type where typname='invoice_status') then
    create type invoice_status as enum ('draft','issued','sent','partial','paid','canceled','overdue');
  end if;
  if not exists (select 1 from pg_type where typname='ar_ap_status') then
    create type ar_ap_status as enum ('open','partial','paid','canceled','overdue');
  end if;
  if not exists (select 1 from pg_type where typname='source_type') then
    create type source_type as enum ('invoice','payment','bill','provision','adjustment');
  end if;
end $$;

create sequence if not exists invoice_global_seq;

-- =========================
-- 2) FUNÇÕES UTILITÁRIAS & AUDITORIA
-- =========================
create or replace function trg_set_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function current_user_id()
returns uuid language sql stable as $$ select nullif((auth.uid())::text,'')::uuid $$;

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid, entity text not null, entity_id uuid, action text not null,
  old_data jsonb, new_data jsonb, ip text, user_agent text,
  at timestamptz not null default now()
);

create or replace function audit_row_change()
returns trigger language plpgsql as $$
declare v_action text; v_entity text := tg_table_name; v_id uuid;
begin
  if tg_op='INSERT' then v_action:='create'; v_id:=new.id;
    insert into audit_log(actor_user_id,entity,entity_id,action,old_data,new_data)
    values(current_user_id(),v_entity,v_id,v_action,null,to_jsonb(new)); return new;
  elsif tg_op='UPDATE' then v_action:='update'; v_id:=new.id;
    insert into audit_log(actor_user_id,entity,entity_id,action,old_data,new_data)
    values(current_user_id(),v_entity,v_id,v_action,to_jsonb(old),to_jsonb(new)); return new;
  else v_action:='delete'; v_id:=old.id;
    insert into audit_log(actor_user_id,entity,entity_id,action,old_data,new_data)
    values(current_user_id(),v_entity,v_id,v_action,to_jsonb(old),null); return old;
  end if;
end $$;

create or replace function gen_invoice_number(p_issue_date date)
returns text language plpgsql as $$
declare v_year text := to_char(p_issue_date,'YYYY'); v_seq bigint;
begin v_seq := nextval('invoice_global_seq'); return 'INV-'||v_year||lpad(v_seq::text,6,'0'); end $$;

-- =========================
-- 3) NÚCLEO ORGANIZACIONAL & RBAC
-- =========================
create table if not exists company (
  id uuid primary key default gen_random_uuid(),
  name text not null, ein text, country_code text, timezone text,
  functional_currency text not null default 'USD',
  created_at timestamptz default now(), updated_at timestamptz
);
create trigger trg_company_ts before update on company for each row execute function trg_set_timestamp();

create table if not exists branch (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  name text not null, country_code text, timezone text,
  functional_currency text not null default 'USD',
  active boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_branch_company on branch(company_id);
create trigger trg_branch_ts before update on branch for each row execute function trg_set_timestamp();
create trigger trg_branch_audit after insert or update or delete on branch for each row execute function audit_row_change();

create table if not exists user_profile (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  company_id uuid not null references company(id) on delete restrict,
  branch_id uuid references branch(id) on delete set null,
  preferred_locale text not null default 'pt-BR',
  is_master boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_user_profile_company on user_profile(company_id);
create trigger trg_user_profile_ts before update on user_profile for each row execute function trg_set_timestamp();
create trigger trg_user_profile_audit after insert or update or delete on user_profile for each row execute function audit_row_change();

create table if not exists role (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  name text not null, description text, can_view_all_employees boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_role_company on role(company_id);
create trigger trg_role_ts before update on role for each row execute function trg_set_timestamp();
create trigger trg_role_audit after insert or update or delete on role for each row execute function audit_row_change();

create table if not exists permission (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  resource text not null, action permission_action not null,
  created_at timestamptz default now(), updated_at timestamptz
);
create unique index if not exists uq_permission on permission(company_id,resource,action);
create trigger trg_permission_ts before update on permission for each row execute function trg_set_timestamp();
create trigger trg_permission_audit after insert or update or delete on permission for each row execute function audit_row_change();

create table if not exists role_permission (
  role_id uuid references role(id) on delete cascade,
  permission_id uuid references permission(id) on delete cascade,
  primary key(role_id,permission_id)
);
create trigger trg_role_perm_audit after insert or update or delete on role_permission for each row execute function audit_row_change();

create table if not exists user_role (
  user_profile_id uuid references user_profile(id) on delete cascade,
  role_id uuid references role(id) on delete cascade,
  primary key(user_profile_id,role_id)
);
create trigger trg_user_role_audit after insert or update or delete on user_role for each row execute function audit_row_change();

-- =========================
-- 4) CONFIGURAÇÕES (COA, MOEDAS, FX, TEMPLATES)
-- =========================
create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  code text not null, name text not null,
  type text not null check (type in ('asset','liability','equity','revenue','expense')),
  parent_id uuid references chart_of_accounts(id),
  created_at timestamptz default now(), updated_at timestamptz
);
create unique index if not exists uq_coa_branch_code on chart_of_accounts(branch_id, code);
create trigger trg_coa_ts before update on chart_of_accounts for each row execute function trg_set_timestamp();
create trigger trg_coa_audit after insert or update or delete on chart_of_accounts for each row execute function audit_row_change();

create table if not exists payment_method (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  code text not null, active boolean not null default true, metadata jsonb,
  created_at timestamptz default now(), updated_at timestamptz
);
create unique index if not exists uq_payment_method on payment_method(branch_id, code);
create trigger trg_payment_method_ts before update on payment_method for each row execute function trg_set_timestamp();
create trigger trg_payment_method_audit after insert or update or delete on payment_method for each row execute function audit_row_change();

create table if not exists currency (
  code text primary key, symbol text not null, decimals int not null default 2
);

create table if not exists fx_rate (
  id uuid primary key default gen_random_uuid(),
  date date not null, base text not null default 'USD',
  quote text not null references currency(code), rate numeric(18,8) not null,
  provider text, retrieved_at timestamptz default now(),
  created_at timestamptz default now(), updated_at timestamptz
);
create unique index if not exists uq_fx_rate on fx_rate(date, base, quote);
create trigger trg_fx_rate_ts before update on fx_rate for each row execute function trg_set_timestamp();
create trigger trg_fx_rate_audit after insert or update or delete on fx_rate for each row execute function audit_row_change();

create table if not exists invoice_template (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  key text not null, layout jsonb not null, active boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz
);
create unique index if not exists uq_invoice_template on invoice_template(branch_id, key);
create trigger trg_invoice_template_audit after insert or update or delete on invoice_template for each row execute function audit_row_change();

create table if not exists email_template (
  id uuid primary key default gen_random_uuid(),
  key text not null, translations jsonb not null,
  created_at timestamptz default now(), updated_at timestamptz
);
create unique index if not exists uq_email_template_key on email_template(key);
create trigger trg_email_template_audit after insert or update or delete on email_template for each row execute function audit_row_change();

-- =========================
-- 5) BANCOS & CAIXA
-- =========================
create table if not exists bank_account (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  name text not null, provider text, currency_code text not null references currency(code),
  number_masked text, active boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_bank_account_branch on bank_account(branch_id);
create trigger trg_bank_account_ts before update on bank_account for each row execute function trg_set_timestamp();
create trigger trg_bank_account_audit after insert or update or delete on bank_account for each row execute function audit_row_change();

create table if not exists cash_movement (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references bank_account(id) on delete cascade,
  currency_code text not null references currency(code),
  amount numeric(18,2) not null, usd_equiv numeric(18,2),
  fx_rate_used numeric(18,8), date date not null,
  reference_type text, reference_id uuid, note text,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_cash_move_bank_date on cash_movement(bank_account_id, date);
create trigger trg_cash_movement_ts before update on cash_movement for each row execute function trg_set_timestamp();
create trigger trg_cash_movement_audit after insert or update or delete on cash_movement for each row execute function audit_row_change();

-- =========================
-- 6) CRM (CLIENTES & FORNECEDORES)
-- =========================
create table if not exists customer (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  legal_name text not null, trade_name text, country_code text, tax_id text,
  default_language text, addresses jsonb, contacts jsonb,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_customer_branch on customer(branch_id);
create trigger trg_customer_ts before update on customer for each row execute function trg_set_timestamp();
create trigger trg_customer_audit after insert or update or delete on customer for each row execute function audit_row_change();

create table if not exists vendor (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  legal_name text not null, country_code text, tax_id text,
  requires_invoice_pdf boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_vendor_branch on vendor(branch_id);
create trigger trg_vendor_ts before update on vendor for each row execute function trg_set_timestamp();
create trigger trg_vendor_audit after insert or update or delete on vendor for each row execute function audit_row_change();

-- =========================
-- 7) FATURAMENTO (CONTRATOS & FATURAS)
-- =========================
create table if not exists contract (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  customer_id uuid not null references customer(id) on delete restrict,
  start_date date not null, end_date date,
  billing_model contract_billing_model not null,
  recognition contract_recognition not null,
  status text not null default 'ativo',
  language text not null default 'pt-BR',
  notes text,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_contract_branch_customer on contract(branch_id, customer_id);
create trigger trg_contract_ts before update on contract for each row execute function trg_set_timestamp();
create trigger trg_contract_audit after insert or update or delete on contract for each row execute function audit_row_change();

create table if not exists contract_item (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contract(id) on delete cascade,
  service_key text not null, description text,
  currency_code text not null references currency(code),
  unit_price numeric(18,2) not null, quantity numeric(18,4) not null default 1,
  recurrence recurrence_type not null default 'none',
  duration_months int, next_bill_date date,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_contract_item_contract on contract_item(contract_id);
create trigger trg_contract_item_ts before update on contract_item for each row execute function trg_set_timestamp();

create table if not exists invoice (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  customer_id uuid not null references customer(id) on delete restrict,
  contract_id uuid references contract(id) on delete set null,
  number text unique,
  issue_date date not null, due_date date not null,
  currency_code text not null references currency(code),
  subtotal numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total numeric(18,2) not null default 0,
  usd_equiv_total numeric(18,2),
  fx_rate_used numeric(18,8),
  fx_rate_source text,
  fx_rate_timestamp timestamptz,
  status invoice_status not null default 'draft',
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_invoice_branch_customer on invoice(branch_id, customer_id);
create trigger trg_invoice_ts before update on invoice for each row execute function trg_set_timestamp();

create or replace function trg_invoice_set_number()
returns trigger language plpgsql as $$
begin
  if (new.status='issued' and (new.number is null or new.number='')) then
    new.number := gen_invoice_number(coalesce(new.issue_date,current_date));
  end if; return new;
end $$;
create trigger tbi_invoice_set_number before insert or update on invoice
for each row execute function trg_invoice_set_number();

create trigger trg_invoice_audit after insert or update or delete on invoice
for each row execute function audit_row_change();

create table if not exists invoice_line (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoice(id) on delete cascade,
  service_key text not null, description text,
  quantity numeric(18,4) not null default 1,
  unit_price numeric(18,2) not null, line_total numeric(18,2) not null,
  taxable_us boolean not null default false
);
create index if not exists idx_invoice_line_invoice on invoice_line(invoice_id);

create table if not exists invoice_delivery (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoice(id) on delete cascade,
  to_email text not null, sent_at timestamptz,
  message_locale text, status text, provider_message_id text
);

-- =========================
-- 8) FINANCEIRO (AR/AP/PAGAMENTOS/PROVISÕES/LEDGER)
-- =========================
create table if not exists accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  customer_id uuid not null references customer(id) on delete restrict,
  invoice_id uuid not null references invoice(id) on delete restrict,
  currency_code text not null references currency(code),
  amount numeric(18,2) not null, usd_equiv_amount numeric(18,2),
  fx_rate_used numeric(18,8), due_date date not null,
  status ar_ap_status not null default 'open',
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_ar_branch_due on accounts_receivable(branch_id, due_date);
create trigger trg_ar_ts before update on accounts_receivable for each row execute function trg_set_timestamp();
create trigger trg_ar_audit after insert or update or delete on accounts_receivable for each row execute function audit_row_change();

create table if not exists accounts_payable (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  vendor_id uuid not null references vendor(id) on delete restrict,
  document_pdf_url text not null,
  currency_code text not null references currency(code),
  amount numeric(18,2) not null, usd_equiv_amount numeric(18,2),
  fx_rate_used numeric(18,8), due_date date not null,
  installments jsonb, recurrence recurrence_type not null default 'none',
  recurrence_end_date date, status ar_ap_status not null default 'open',
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_ap_branch_due on accounts_payable(branch_id, due_date);
create trigger trg_ap_ts before update on accounts_payable for each row execute function trg_set_timestamp();
create trigger trg_ap_audit after insert or update or delete on accounts_payable for each row execute function audit_row_change();

create table if not exists payment (
  id uuid primary key default gen_random_uuid(),
  reference_type text not null, reference_id uuid not null,
  bank_account_id uuid not null references bank_account(id),
  currency_code text not null references currency(code),
  amount numeric(18,2) not null, usd_equiv_amount numeric(18,2),
  fx_rate_used numeric(18,8), fx_rate_source text,
  fx_fee_amount numeric(18,2) not null default 0, fx_fee_note text,
  paid_at date not null, attachment_url text,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_payment_ref on payment(reference_type, reference_id);
create trigger trg_payment_ts before update on payment for each row execute function trg_set_timestamp();
create trigger trg_payment_audit after insert or update or delete on payment for each row execute function audit_row_change();

create table if not exists provision (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  reference_type text not null, description text,
  currency_code text not null references currency(code),
  amount numeric(18,2) not null, usd_equiv_amount numeric(18,2),
  fx_rate_used numeric(18,8), month_ref date not null,
  status text not null default 'booked',
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_provision_branch_month on provision(branch_id, month_ref);
create trigger trg_provision_ts before update on provision for each row execute function trg_set_timestamp();
create trigger trg_provision_audit after insert or update or delete on provision for each row execute function audit_row_change();

create table if not exists ledger_entry (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id) on delete cascade,
  coa_id uuid not null references chart_of_accounts(id) on delete restrict,
  date date not null, currency_code text not null references currency(code),
  debit numeric(18,2) not null default 0, credit numeric(18,2) not null default 0,
  usd_equiv_debit numeric(18,2) not null default 0, usd_equiv_credit numeric(18,2) not null default 0,
  memo text, source source_type not null, source_id uuid not null,
  created_at timestamptz default now(), updated_at timestamptz
);
create index if not exists idx_ledger_branch_date on ledger_entry(branch_id, date);
create trigger trg_ledger_ts before update on ledger_entry for each row execute function trg_set_timestamp();

-- =========================
-- 9) IMPOSTOS EUA & LOG DE ACESSO
-- =========================
create table if not exists sales_tax_rule (
  id uuid primary key default gen_random_uuid(),
  state_code text not null, rate numeric(8,6) not null,
  active boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz
);
create unique index if not exists uq_sales_tax_state on sales_tax_rule(state_code);
create trigger trg_sales_tax_rule_ts before update on sales_tax_rule for each row execute function trg_set_timestamp();

create table if not exists access_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, module text, route text, at timestamptz not null default now()
);

-- =========================
-- 10) RLS (ATIVAÇÃO & POLÍTICAS)
-- =========================
alter table company enable row level security;
alter table branch enable row level security;
alter table user_profile enable row level security;
alter table role enable row level security;
alter table permission enable row level security;
alter table role_permission enable row level security;
alter table user_role enable row level security;

alter table chart_of_accounts enable row level security;
alter table payment_method enable row level security;
alter table currency enable row level security;
alter table fx_rate enable row level security;
alter table invoice_template enable row level security;
alter table email_template enable row level security;

alter table bank_account enable row level security;
alter table cash_movement enable row level security;

alter table customer enable row level security;
alter table vendor enable row level security;

alter table contract enable row level security;
alter table contract_item enable row level security;
alter table invoice enable row level security;
alter table invoice_line enable row level security;
alter table invoice_delivery enable row level security;

alter table accounts_receivable enable row level security;
alter table accounts_payable enable row level security;
alter table payment enable row level security;
alter table provision enable row level security;
alter table ledger_entry enable row level security;

alter table sales_tax_rule enable row level security;
alter table audit_log enable row level security;
alter table access_log enable row level security;

create or replace function jwt_company_id()
returns uuid language sql stable as $$
  select nullif((auth.jwt() ->> 'company_id'),'')::uuid;
$$;

-- company
create policy sel_company on company for select using (id = jwt_company_id());
create policy upd_company on company for update using (id = jwt_company_id());

-- branch
create policy all_branch on branch
for all using (company_id = jwt_company_id()) with check (company_id = jwt_company_id());

-- user_profile
create policy all_user_profile on user_profile
for all using (company_id = jwt_company_id()) with check (company_id = jwt_company_id());

-- role / permission
create policy all_role on role
for all using (company_id = jwt_company_id()) with check (company_id = jwt_company_id());
create policy all_permission on permission
for all using (company_id = jwt_company_id()) with check (company_id = jwt_company_id());

-- role_permission
create policy all_role_permission on role_permission
for all using (
  exists(select 1 from role r where r.id=role_permission.role_id and r.company_id=jwt_company_id())
)
with check (
  exists(select 1 from role r where r.id=role_permission.role_id and r.company_id=jwt_company_id())
  and exists(select 1 from permission p join role r on r.company_id=p.company_id
             where p.id=role_permission.permission_id and r.company_id=jwt_company_id())
);

-- user_role
create policy all_user_role on user_role
for all using (
  exists(select 1 from user_profile up where up.id=user_role.user_profile_id and up.company_id=jwt_company_id())
  and exists(select 1 from role r where r.id=user_role.role_id and r.company_id=jwt_company_id())
)
with check (
  exists(select 1 from user_profile up where up.id=user_role.user_profile_id and up.company_id=jwt_company_id())
  and exists(select 1 from role r where r.id=user_role.role_id and r.company_id=jwt_company_id())
);

-- COA / payment_method / templates
create policy all_coa on chart_of_accounts
for all using (
  exists(select 1 from branch b where b.id=chart_of_accounts.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=chart_of_accounts.branch_id and b.company_id=jwt_company_id())
);

create policy all_payment_method on payment_method
for all using (
  exists(select 1 from branch b where b.id=payment_method.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=payment_method.branch_id and b.company_id=jwt_company_id())
);

create policy sel_currency on currency for select using (true);
create policy sel_fx_rate on fx_rate for select using (true);

create policy all_invoice_template on invoice_template
for all using (
  exists(select 1 from branch b where b.id=invoice_template.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=invoice_template.branch_id and b.company_id=jwt_company_id())
);

-- bank_account
create policy all_bank_account on bank_account
for all using (
  exists(select 1 from branch b where b.id=bank_account.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=bank_account.branch_id and b.company_id=jwt_company_id())
);

-- cash_movement (corrigido: políticas separadas)
create policy sel_cash_movement on cash_movement
for select using (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id=cash_movement.bank_account_id and b.company_id=jwt_company_id())
);

create policy ins_cash_movement on cash_movement
for insert
with check (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id=cash_movement.bank_account_id and b.company_id=jwt_company_id())
);

create policy upd_cash_movement on cash_movement
for update
using (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id=cash_movement.bank_account_id and b.company_id=jwt_company_id())
)
with check (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id=cash_movement.bank_account_id and b.company_id=jwt_company_id())
);

create policy del_cash_movement on cash_movement
for delete
using (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id=cash_movement.bank_account_id and b.company_id=jwt_company_id())
);

-- CRM
create policy all_customer on customer
for all using (
  exists(select 1 from branch b where b.id=customer.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=customer.branch_id and b.company_id=jwt_company_id())
);

create policy all_vendor on vendor
for all using (
  exists(select 1 from branch b where b.id=vendor.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=vendor.branch_id and b.company_id=jwt_company_id())
);

-- billing
create policy all_contract on contract
for all using (
  exists(select 1 from branch b where b.id=contract.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=contract.branch_id and b.company_id=jwt_company_id())
);

create policy all_contract_item on contract_item
for all using (
  exists(select 1 from contract c join branch b on b.id=c.branch_id
         where c.id=contract_item.contract_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from contract c join branch b on b.id=c.branch_id
         where c.id=contract_item.contract_id and b.company_id=jwt_company_id())
);

create policy all_invoice on invoice
for all using (
  exists(select 1 from branch b where b.id=invoice.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=invoice.branch_id and b.company_id=jwt_company_id())
);

create policy all_invoice_line on invoice_line
for all using (
  exists(select 1 from invoice i join branch b on b.id=i.branch_id
         where i.id=invoice_line.invoice_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from invoice i join branch b on b.id=i.branch_id
         where i.id=invoice_line.invoice_id and b.company_id=jwt_company_id())
);

create policy all_invoice_delivery on invoice_delivery
for all using (
  exists(select 1 from invoice i join branch b on b.id=i.branch_id
         where i.id=invoice_delivery.invoice_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from invoice i join branch b on b.id=i.branch_id
         where i.id=invoice_delivery.invoice_id and b.company_id=jwt_company_id())
);

-- financeiro
create policy all_ar on accounts_receivable
for all using (
  exists(select 1 from branch b where b.id=accounts_receivable.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=accounts_receivable.branch_id and b.company_id=jwt_company_id())
);

create policy all_ap on accounts_payable
for all using (
  exists(select 1 from branch b where b.id=accounts_payable.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=accounts_payable.branch_id and b.company_id=jwt_company_id())
);

-- payment (corrigido: políticas separadas)
create policy sel_payment on payment
for select using (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id = payment.bank_account_id and b.company_id = jwt_company_id())
);

create policy ins_payment on payment
for insert
with check (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id = payment.bank_account_id and b.company_id = jwt_company_id())
);

create policy upd_payment on payment
for update
using (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id = payment.bank_account_id and b.company_id = jwt_company_id())
)
with check (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id = payment.bank_account_id and b.company_id = jwt_company_id())
);

create policy del_payment on payment
for delete
using (
  exists(select 1 from bank_account ba join branch b on b.id=ba.branch_id
         where ba.id = payment.bank_account_id and b.company_id = jwt_company_id())
);

create policy all_provision on provision
for all using (
  exists(select 1 from branch b where b.id=provision.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=provision.branch_id and b.company_id=jwt_company_id())
);

create policy all_ledger on ledger_entry
for all using (
  exists(select 1 from branch b where b.id=ledger_entry.branch_id and b.company_id=jwt_company_id())
) with check (
  exists(select 1 from branch b where b.id=ledger_entry.branch_id and b.company_id=jwt_company_id())
);

-- auxiliares
create policy sel_sales_tax_rule on sales_tax_rule for select using (true);
create policy sel_audit on audit_log for select using (true);
create policy sel_access_log on access_log for select using (true);
create policy ins_access_log on access_log for insert with check (true);

-- =========================
-- 11) TRIGGERS DE AUDITORIA (já aplicados acima nos CREATEs principais)
-- =========================
-- (Nada adicional aqui.)

-- =========================
-- 12) SEEDS BÁSICOS
-- =========================
insert into currency(code, symbol, decimals) values
  ('USD','$',2), ('EUR','€',2), ('BRL','R$',2)
on conflict do nothing;

insert into company(id, name, functional_currency, country_code, timezone)
values (gen_random_uuid(),'Empresa Matriz','USD','US','America/New_York')
on conflict do nothing;

insert into branch(id, company_id, name, country_code, timezone, functional_currency)
select gen_random_uuid(), c.id, 'Matriz - Global', 'US', 'America/New_York', 'USD'
from company c
on conflict do nothing;

with b as (select id as branch_id from branch limit 1)
insert into chart_of_accounts(id, branch_id, code, name, type)
select gen_random_uuid(), b.branch_id, '1.1', 'Caixa e Bancos', 'asset' from b
union all select gen_random_uuid(), b.branch_id, '1.2', 'Contas a Receber', 'asset' from b
union all select gen_random_uuid(), b.branch_id, '2.1', 'Contas a Pagar', 'liability' from b
union all select gen_random_uuid(), b.branch_id, '4.1', 'Receitas Recorrentes', 'revenue' from b
union all select gen_random_uuid(), b.branch_id, '4.2', 'Receitas Pontuais', 'revenue' from b
union all select gen_random_uuid(), b.branch_id, '5.1', 'Despesas Operacionais', 'expense' from b
on conflict do nothing;

with b as (select id as branch_id from branch limit 1)
insert into payment_method(id, branch_id, code, active)
select gen_random_uuid(), b.branch_id, 'wire', true from b
union all
select gen_random_uuid(), b.branch_id, 'stripe', false from b
on conflict do nothing;
