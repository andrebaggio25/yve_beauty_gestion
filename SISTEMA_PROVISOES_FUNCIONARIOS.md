## 📊 Sistema de Provisões Vinculadas a Funcionários

## 🎯 Objetivo

Criar um sistema automático de provisões mensais para funcionários que:
- Cria provisões automaticamente ao cadastrar funcionário com valor de contrato
- Atualiza provisões futuras automaticamente quando o valor do contrato muda
- Mantém histórico do valor do contrato em cada provisão
- Funciona para TODOS os tipos de contrato (não apenas terceiros)

---

## ✨ Funcionalidades Implementadas

### 1. 📝 **Tax ID Dinâmico por País**

Assim como nos clientes, agora os funcionários também têm identificação fiscal dinâmica:

**Exemplos**:
- 🇧🇷 Brasil: CPF (Pessoa Física) / CNPJ (Pessoa Jurídica)
- 🇺🇸 EUA: SSN (Individual) / EIN (Business)
- 🇪🇸 Espanha: NIF / NIE / CIF
- 🇵🇹 Portugal: NIF / NIPC

**Por que isso é importante?**
- Faturas podem ser emitidas tanto para pessoa física quanto jurídica
- Funcionários podem ter contratos PJ (Pessoa Jurídica)
- Terceiros geralmente são PJ

---

### 2. 💰 **Valor de Contrato para Todos os Tipos**

Anteriormente, o valor do contrato só aparecia para "Terceiros". Agora está disponível para:

- ✅ **Fixo** - Contrato por tempo indeterminado
- ✅ **Temporário** - Contrato por tempo determinado
- ✅ **Estagiário** - Contrato de estágio
- ✅ **Terceiro** - Prestador de serviços

**Por que todos os tipos?**
- Permite provisionar pagamentos para qualquer tipo de contrato
- Facilita planejamento financeiro
- Automatiza geração de provisões mensais

---

### 3. 🔗 **Sistema de Provisões Vinculadas**

#### Como Funciona:

**Ao Criar Funcionário:**
1. Se `contract_value > 0`, cria provisões mensais automaticamente
2. Provisões são criadas de `start_date` até `end_date` (ou +12 meses se não houver data fim)
3. Cada provisão é vinculada ao funcionário (`employee_id`)
4. Valor do contrato é salvo em cada provisão (`contract_value_at_time`)

**Ao Atualizar Valor do Contrato:**
1. **Trigger automático** detecta mudança no valor
2. Atualiza TODAS as provisões futuras (não pagas)
3. Mantém provisões já pagas com valor original (histórico)
4. Atualiza `contract_value_at_time` para o novo valor

**Exemplo Prático:**
```
Funcionário: João Silva
Contrato inicial: USD 1.000/mês
Data início: 01/01/2025

Provisões criadas:
- Jan/2025: USD 1.000 (status: booked)
- Fev/2025: USD 1.000 (status: booked)
- Mar/2025: USD 1.000 (status: booked)
- ...

Em 15/02/2025, contrato muda para USD 1.200:
- Jan/2025: USD 1.000 (já pago, mantém valor original)
- Fev/2025: USD 1.200 (atualizado automaticamente)
- Mar/2025: USD 1.200 (atualizado automaticamente)
- ...
```

---

## 🗄️ Estrutura de Banco de Dados

### Tabela Employee (atualizada)

```sql
alter table employee
  add column if not exists tax_id_type text;
```

### Tabela Provision (atualizada)

```sql
alter table provision
  add column if not exists employee_id uuid references employee(id);
  
alter table provision
  add column if not exists contract_value_at_time numeric(18,2);
```

**Campos**:
- `employee_id`: Vincula provisão ao funcionário
- `contract_value_at_time`: Valor do contrato no momento da criação (histórico)
- `month_ref`: Mês de referência da provisão
- `status`: 'booked' (provisionado) ou 'paid' (pago)

---

## 🔧 Funções do Banco de Dados

### 1. `create_employee_provisions()`

Cria provisões mensais para um funcionário.

**Parâmetros**:
- `p_employee_id`: ID do funcionário
- `p_start_date`: Data de início
- `p_end_date`: Data de fim (opcional)
- `p_contract_value`: Valor mensal do contrato
- `p_currency_code`: Moeda (USD, BRL, EUR, etc.)
- `p_payment_day`: Dia do pagamento (1-31)

**Retorna**: Número de provisões criadas

**Exemplo**:
```sql
select create_employee_provisions(
  'uuid-do-funcionario',
  '2025-01-01',
  '2025-12-31',
  1000.00,
  'USD',
  5
);
-- Retorna: 12 (12 meses de provisões)
```

---

### 2. `update_future_provisions()`

Atualiza provisões futuras quando o valor do contrato muda.

**Parâmetros**:
- `p_employee_id`: ID do funcionário
- `p_new_contract_value`: Novo valor do contrato
- `p_currency_code`: Moeda
- `p_effective_date`: Data efetiva da mudança

**Retorna**: Número de provisões atualizadas

**Exemplo**:
```sql
select update_future_provisions(
  'uuid-do-funcionario',
  1200.00,
  'USD',
  '2025-02-01'
);
-- Retorna: 11 (atualiza fev a dez, jan já foi pago)
```

---

### 3. `delete_future_provisions()`

Deleta provisões futuras (útil quando funcionário é desligado).

**Parâmetros**:
- `p_employee_id`: ID do funcionário
- `p_from_date`: A partir de qual data deletar

**Retorna**: Número de provisões deletadas

**Exemplo**:
```sql
select delete_future_provisions(
  'uuid-do-funcionario',
  '2025-06-01'
);
-- Deleta provisões de junho em diante
```

---

## 🤖 Trigger Automático

### `trg_employee_update_provisions`

**Dispara quando**:
- `contract_value` muda
- `contract_currency` muda
- `end_date` muda

**O que faz**:
1. Se valor mudou: atualiza provisões futuras
2. Se data fim mudou: deleta provisões após a nova data

**Vantagens**:
- ✅ Automático - não precisa lembrar de atualizar
- ✅ Consistente - sempre atualiza corretamente
- ✅ Rápido - executa no banco de dados
- ✅ Seguro - só atualiza provisões não pagas

---

## 📊 View Helper

### `employee_provisions_summary`

Resumo de provisões por funcionário.

**Campos**:
- `employee_id`
- `employee_name`
- `contract_value`
- `contract_currency`
- `total_provisions`: Total de provisões
- `booked_provisions`: Provisões não pagas
- `paid_provisions`: Provisões pagas
- `total_booked_amount`: Valor total provisionado
- `total_paid_amount`: Valor total pago
- `first_provision_month`: Primeiro mês
- `last_provision_month`: Último mês

**Exemplo**:
```sql
select * from employee_provisions_summary
where employee_id = 'uuid-do-funcionario';
```

---

## 💻 Uso no Código

### Criar Funcionário com Provisões

```typescript
const employee = await createEmployee({
  first_name: 'João',
  last_name: 'Silva',
  email: 'joao@example.com',
  country_code: 'BR',
  tax_id_type: 'CPF',
  tax_id: '123.456.789-00',
  contract_type: 'fixed',
  contract_value: 5000.00,
  contract_currency: 'BRL',
  payment_day: 5,
  start_date: '2025-01-01',
  end_date: '2025-12-31',
})

// Provisões são criadas automaticamente!
// Jan/2025: BRL 5.000
// Fev/2025: BRL 5.000
// ...
// Dez/2025: BRL 5.000
```

### Atualizar Valor do Contrato

```typescript
const updatedEmployee = await updateEmployee({
  id: employee.id,
  contract_value: 6000.00, // Aumentou de 5.000 para 6.000
})

// Trigger automático atualiza todas as provisões futuras!
```

### Listar Provisões do Funcionário

```typescript
const provisions = await listEmployeeProvisions(employee.id)

provisions.forEach(p => {
  console.log(`${p.month_ref}: ${p.currency_code} ${p.amount} (${p.status})`)
})
```

### Ver Resumo de Provisões

```typescript
const summary = await getEmployeeProvisionsSummary(employee.id)

console.log(`Total provisionado: ${summary.total_booked_amount}`)
console.log(`Total pago: ${summary.total_paid_amount}`)
console.log(`Provisões pendentes: ${summary.booked_provisions}`)
```

---

## 🎨 Interface do Usuário

### Formulário de Funcionário

**Seção "Valores e Provisões"**:
- Campo "Valor do Contrato Mensal" visível para TODOS os tipos
- Seletor de moeda
- Mensagem explicativa sobre provisões automáticas
- Preview do que será criado

**Feedback Visual**:
```
💡 Configure o valor do contrato para gerar provisões automáticas mensais

[Valor do Contrato Mensal]  [Moeda do Contrato]
5000.00                      BRL

📊 Provisões Automáticas: Ao salvar, serão criadas provisões mensais 
de BRL 5000.00 a partir da data de início.

⚠️ Ao alterar o valor do contrato, todas as provisões futuras (não pagas) 
serão atualizadas automaticamente.
```

---

## 🔄 Fluxo Completo

### 1. Cadastro Inicial

```
Usuário preenche formulário:
├─ Nome: João Silva
├─ País: Brasil
├─ Tax ID Type: CPF (selecionado automaticamente)
├─ Tax ID: 123.456.789-00
├─ Tipo Contrato: Fixo
├─ Valor Mensal: BRL 5.000
├─ Data Início: 01/01/2025
└─ Data Fim: 31/12/2025

Sistema cria:
├─ Funcionário no banco
└─ 12 provisões mensais (Jan a Dez 2025)
```

### 2. Mudança de Valor

```
Usuário atualiza:
└─ Valor Mensal: BRL 5.000 → BRL 6.000

Trigger automático:
├─ Detecta mudança
├─ Busca provisões futuras (status = 'booked')
├─ Atualiza valor de todas
└─ Mantém provisões pagas com valor original
```

### 3. Pagamento de Provisão

```
Sistema de pagamento:
├─ Marca provisão como 'paid'
├─ Registra data de pagamento
└─ Provisão não será mais atualizada (histórico preservado)
```

---

## 📋 Migrations

### Migration 10: Tax ID Type
```sql
-- lib/supabase/migrations/10_add_tax_id_type_to_employee.sql
alter table employee add column if not exists tax_id_type text;
```

### Migration 11: Provisões Vinculadas
```sql
-- lib/supabase/migrations/11_link_provisions_to_employees.sql
-- Adiciona employee_id e contract_value_at_time
-- Cria funções e triggers
-- Cria view de resumo
```

---

## ✅ Checklist de Aplicação

- [ ] Aplicar Migration 10 (tax_id_type)
- [ ] Aplicar Migration 11 (provisões vinculadas)
- [ ] Testar cadastro de funcionário com valor de contrato
- [ ] Verificar se provisões foram criadas
- [ ] Testar atualização de valor de contrato
- [ ] Verificar se provisões futuras foram atualizadas
- [ ] Testar com diferentes tipos de contrato
- [ ] Verificar view de resumo

---

## 🎯 Benefícios

### Para o Usuário
- ✅ **Automação total** - não precisa criar provisões manualmente
- ✅ **Atualização inteligente** - mudanças refletem automaticamente
- ✅ **Histórico preservado** - valores pagos não mudam
- ✅ **Flexibilidade** - funciona para todos os tipos de contrato

### Para o Sistema
- ✅ **Consistência** - trigger garante que tudo está sincronizado
- ✅ **Performance** - operações no banco de dados são rápidas
- ✅ **Auditoria** - `contract_value_at_time` mantém histórico
- ✅ **Escalabilidade** - funciona com milhares de funcionários

### Para o Negócio
- ✅ **Planejamento** - visão clara de custos futuros
- ✅ **Controle** - provisões sempre atualizadas
- ✅ **Relatórios** - dados precisos para análise
- ✅ **Compliance** - histórico completo de mudanças

---

## 🔍 Queries Úteis

### Ver todas as provisões de um funcionário
```sql
select 
  month_ref,
  amount,
  contract_value_at_time,
  status,
  created_at
from provision
where employee_id = 'uuid-do-funcionario'
order by month_ref;
```

### Ver mudanças de valor ao longo do tempo
```sql
select 
  month_ref,
  contract_value_at_time,
  status
from provision
where employee_id = 'uuid-do-funcionario'
order by month_ref;
```

### Resumo de todos os funcionários
```sql
select * from employee_provisions_summary
order by total_booked_amount desc;
```

### Total provisionado por mês
```sql
select 
  month_ref,
  count(*) as num_employees,
  sum(amount) as total_amount,
  currency_code
from provision
where status = 'booked'
group by month_ref, currency_code
order by month_ref;
```

---

## 🚀 Próximos Passos

1. ✅ Aplicar migrations
2. ✅ Testar cadastro e atualização
3. 🔜 Implementar tela de visualização de provisões
4. 🔜 Adicionar relatório de provisões por funcionário
5. 🔜 Criar dashboard de custos mensais
6. 🔜 Integrar com sistema de pagamentos
7. 🔜 Notificações de provisões próximas ao vencimento

---

**Data de Criação**: 2025-11-01  
**Versão**: 1.0.0  
**Autor**: Sistema de Gestão Yve Beauty

