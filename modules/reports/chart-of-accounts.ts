import { createClient } from '@/lib/supabase/client'
import type { ChartOfAccount, CreateCOAInput, UpdateCOAInput } from '@/types/reports'

const supabase = createClient()

export async function listChartOfAccounts(companyId?: string): Promise<ChartOfAccount[]> {
  let query = supabase
    .from('chart_of_account')
    .select('*')
    .eq('is_active', true)
    .order('code', { ascending: true })

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getCOAById(id: string): Promise<ChartOfAccount | null> {
  const { data, error } = await supabase
    .from('chart_of_account')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createCOA(companyId: string, input: CreateCOAInput): Promise<ChartOfAccount> {
  const payload = {
    company_id: companyId,
    code: input.code,
    name: input.name,
    account_type: input.account_type,
    parent_id: input.parent_id ?? null,
    description: input.description ?? null,
    normal_balance: input.normal_balance,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('chart_of_account')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as ChartOfAccount
}

export async function updateCOA(input: UpdateCOAInput): Promise<ChartOfAccount> {
  const { id, ...rest } = input
  const { data, error } = await supabase
    .from('chart_of_account')
    .update(rest)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as ChartOfAccount
}

export async function deactivateCOA(id: string): Promise<void> {
  const { error } = await supabase
    .from('chart_of_account')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// Hierarchical structure helper
export async function buildAccountHierarchy(accounts: ChartOfAccount[]): Promise<ChartOfAccount[]> {
  const hierarchy: ChartOfAccount[] = []
  const accountMap = new Map(accounts.map(acc => [acc.id, { ...acc, children: [] }]))

  for (const account of accounts) {
    if (!account.parent_id) {
      hierarchy.push(account)
    }
  }

  return hierarchy
}

// Utility: Get default COA template for new company
export async function createDefaultCOAStructure(companyId: string): Promise<void> {
  const defaultAccounts = [
    // ASSETS
    { code: '1000', name: 'Ativos Circulantes', type: 'ASSET', parent: null, balance: 'DEBIT' },
    { code: '1100', name: 'Caixa', type: 'ASSET', parent: '1000', balance: 'DEBIT' },
    { code: '1200', name: 'Contas a Receber', type: 'ASSET', parent: '1000', balance: 'DEBIT' },
    { code: '1300', name: 'Estoques', type: 'ASSET', parent: '1000', balance: 'DEBIT' },
    { code: '2000', name: 'Ativos Não Circulantes', type: 'ASSET', parent: null, balance: 'DEBIT' },
    { code: '2100', name: 'Imobilizado', type: 'ASSET', parent: '2000', balance: 'DEBIT' },
    // LIABILITIES
    { code: '3000', name: 'Passivos Circulantes', type: 'LIABILITY', parent: null, balance: 'CREDIT' },
    { code: '3100', name: 'Contas a Pagar', type: 'LIABILITY', parent: '3000', balance: 'CREDIT' },
    { code: '3200', name: 'Empréstimos Curto Prazo', type: 'LIABILITY', parent: '3000', balance: 'CREDIT' },
    { code: '4000', name: 'Passivos Não Circulantes', type: 'LIABILITY', parent: null, balance: 'CREDIT' },
    // EQUITY
    { code: '5000', name: 'Patrimônio Líquido', type: 'EQUITY', parent: null, balance: 'CREDIT' },
    { code: '5100', name: 'Capital Social', type: 'EQUITY', parent: '5000', balance: 'CREDIT' },
    { code: '5200', name: 'Lucros Acumulados', type: 'EQUITY', parent: '5000', balance: 'CREDIT' },
    // REVENUE
    { code: '6000', name: 'Receitas', type: 'REVENUE', parent: null, balance: 'CREDIT' },
    { code: '6100', name: 'Vendas de Produtos', type: 'REVENUE', parent: '6000', balance: 'CREDIT' },
    { code: '6200', name: 'Prestação de Serviços', type: 'REVENUE', parent: '6000', balance: 'CREDIT' },
    // EXPENSES
    { code: '7000', name: 'Despesas', type: 'EXPENSE', parent: null, balance: 'DEBIT' },
    { code: '7100', name: 'Custos de Produto Vendido', type: 'EXPENSE', parent: '7000', balance: 'DEBIT' },
    { code: '7200', name: 'Despesas Operacionais', type: 'EXPENSE', parent: '7000', balance: 'DEBIT' },
    { code: '7300', name: 'Despesas Administrativas', type: 'EXPENSE', parent: '7000', balance: 'DEBIT' },
  ]

  const parentMap = new Map<string, string>()

  for (const acc of defaultAccounts) {
    const { data } = await supabase
      .from('chart_of_account')
      .insert({
        company_id: companyId,
        code: acc.code,
        name: acc.name,
        account_type: acc.type,
        parent_id: acc.parent ? parentMap.get(acc.parent) : null,
        normal_balance: acc.balance,
        is_active: true,
      })
      .select('id')
      .single()

    if (data) {
      parentMap.set(acc.code, data.id)
    }
  }
}
