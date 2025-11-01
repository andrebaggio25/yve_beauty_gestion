-- =========================
-- VINCULA PROVISÕES A FUNCIONÁRIOS
-- =========================

-- Adiciona campo employee_id na tabela provision
alter table provision
  add column if not exists employee_id uuid references employee(id) on delete cascade;

-- Adiciona campo contract_value_at_time para histórico
alter table provision
  add column if not exists contract_value_at_time numeric(18,2);

comment on column provision.employee_id is 'ID do funcionário vinculado a esta provisão';
comment on column provision.contract_value_at_time is 'Valor do contrato no momento da criação da provisão (para histórico)';

-- Índice para melhorar performance
create index if not exists idx_provision_employee on provision(employee_id) where employee_id is not null;
create index if not exists idx_provision_employee_month on provision(employee_id, month_ref) where employee_id is not null;

-- Função para criar provisões mensais para um funcionário
create or replace function create_employee_provisions(
  p_employee_id uuid,
  p_start_date date,
  p_end_date date,
  p_contract_value numeric,
  p_currency_code text,
  p_payment_day int
)
returns int
language plpgsql
as $$
declare
  v_branch_id uuid;
  v_current_month date;
  v_months_created int := 0;
  v_employee_name text;
begin
  -- Busca informações do funcionário
  select 
    e.branch_id,
    e.first_name || ' ' || e.last_name
  into v_branch_id, v_employee_name
  from employee e
  where e.id = p_employee_id;

  if v_branch_id is null then
    raise exception 'Employee not found';
  end if;

  -- Gera provisões mensais
  v_current_month := date_trunc('month', p_start_date);
  
  while v_current_month <= coalesce(p_end_date, p_start_date + interval '12 months') loop
    -- Verifica se já existe provisão para este mês
    if not exists (
      select 1 from provision
      where employee_id = p_employee_id
        and month_ref = v_current_month
    ) then
      -- Cria a provisão
      insert into provision (
        branch_id,
        employee_id,
        reference_type,
        description,
        currency_code,
        amount,
        contract_value_at_time,
        month_ref,
        status
      ) values (
        v_branch_id,
        p_employee_id,
        'employee_payroll',
        'Provisão de folha de pagamento - ' || v_employee_name || ' - ' || to_char(v_current_month, 'MM/YYYY'),
        p_currency_code,
        p_contract_value,
        p_contract_value,
        v_current_month,
        'booked'
      );
      
      v_months_created := v_months_created + 1;
    end if;
    
    -- Próximo mês
    v_current_month := v_current_month + interval '1 month';
  end loop;

  return v_months_created;
end;
$$;

comment on function create_employee_provisions is 'Cria provisões mensais para um funcionário';

-- Função para atualizar provisões futuras quando o valor do contrato muda
create or replace function update_future_provisions(
  p_employee_id uuid,
  p_new_contract_value numeric,
  p_currency_code text,
  p_effective_date date
)
returns int
language plpgsql
as $$
declare
  v_updated_count int := 0;
begin
  -- Atualiza todas as provisões futuras (não pagas) a partir da data efetiva
  update provision
  set 
    amount = p_new_contract_value,
    contract_value_at_time = p_new_contract_value,
    currency_code = p_currency_code,
    updated_at = now()
  where employee_id = p_employee_id
    and month_ref >= date_trunc('month', p_effective_date)
    and status = 'booked'; -- Apenas provisões não pagas

  get diagnostics v_updated_count = row_count;
  
  return v_updated_count;
end;
$$;

comment on function update_future_provisions is 'Atualiza provisões futuras quando o valor do contrato muda';

-- Função para deletar provisões futuras
create or replace function delete_future_provisions(
  p_employee_id uuid,
  p_from_date date
)
returns int
language plpgsql
as $$
declare
  v_deleted_count int := 0;
begin
  -- Deleta provisões futuras (não pagas)
  delete from provision
  where employee_id = p_employee_id
    and month_ref >= date_trunc('month', p_from_date)
    and status = 'booked';

  get diagnostics v_deleted_count = row_count;
  
  return v_deleted_count;
end;
$$;

comment on function delete_future_provisions is 'Deleta provisões futuras de um funcionário';

-- View helper para ver provisões de funcionários
create or replace view employee_provisions_summary as
select 
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.contract_value,
  e.contract_currency,
  count(p.id) as total_provisions,
  count(case when p.status = 'booked' then 1 end) as booked_provisions,
  count(case when p.status = 'paid' then 1 end) as paid_provisions,
  sum(case when p.status = 'booked' then p.amount else 0 end) as total_booked_amount,
  sum(case when p.status = 'paid' then p.amount else 0 end) as total_paid_amount,
  min(p.month_ref) as first_provision_month,
  max(p.month_ref) as last_provision_month
from employee e
left join provision p on p.employee_id = e.id
where e.is_active = true
group by e.id, e.first_name, e.last_name, e.contract_value, e.contract_currency;

comment on view employee_provisions_summary is 'Resumo de provisões por funcionário';

-- Trigger para atualizar provisões quando o contrato muda
create or replace function trg_update_employee_provisions()
returns trigger
language plpgsql
as $$
begin
  -- Se o valor do contrato mudou e há um valor definido
  if (new.contract_value is not null and new.contract_value != old.contract_value) or
     (new.contract_currency is not null and new.contract_currency != old.contract_currency) then
    
    -- Atualiza provisões futuras
    perform update_future_provisions(
      new.id,
      new.contract_value,
      new.contract_currency,
      current_date
    );
    
    raise notice 'Updated future provisions for employee %', new.id;
  end if;
  
  -- Se a data de fim mudou
  if new.end_date is not null and (old.end_date is null or new.end_date != old.end_date) then
    -- Deleta provisões após a nova data de fim
    perform delete_future_provisions(
      new.id,
      new.end_date + interval '1 month'
    );
    
    raise notice 'Deleted provisions after end date for employee %', new.id;
  end if;
  
  return new;
end;
$$;

-- Cria o trigger
drop trigger if exists trg_employee_update_provisions on employee;
create trigger trg_employee_update_provisions
  after update on employee
  for each row
  when (
    (new.contract_value is distinct from old.contract_value) or
    (new.contract_currency is distinct from old.contract_currency) or
    (new.end_date is distinct from old.end_date)
  )
  execute function trg_update_employee_provisions();

comment on trigger trg_employee_update_provisions on employee is 'Atualiza provisões automaticamente quando o contrato muda';

