import { BaseEntity } from './common'

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
export type BalanceType = 'DEBIT' | 'CREDIT'

// Chart of Accounts
export interface ChartOfAccount extends BaseEntity {
  company_id: string
  code: string // ex: 1000, 1100, etc
  name: string
  account_type: AccountType
  parent_id: string | null
  is_active: boolean
  description: string | null
  normal_balance: BalanceType
}

// Journal Entries (from AP, AR, Invoices, Payments)
export interface JournalEntry extends BaseEntity {
  company_id: string
  branch_id: string | null
  reference_type: string // 'INVOICE', 'AP', 'AR', 'PAYMENT'
  reference_id: string
  entry_date: string
  description: string
}

export interface JournalEntryLine extends BaseEntity {
  journal_entry_id: string
  account_id: string
  amount: number
  currency: string
  balance_type: BalanceType
  reference: string | null
}

// Report Filters
export interface ReportFilters {
  startDate: string
  endDate: string
  currency?: string
  branchId?: string
  accountId?: string
  showUSD?: boolean
}

// Report Data Structures
export interface LedgerEntry {
  date: string
  description: string
  debit: number
  credit: number
  balance: number
  currency: string
  usdBalance?: number
}

export interface PNLData {
  revenues: {
    accountId: string
    accountName: string
    accountCode: string
    amount: number
    usdAmount?: number
  }[]
  expenses: {
    accountId: string
    accountName: string
    accountCode: string
    amount: number
    usdAmount?: number
  }[]
  netIncome: number
  usdNetIncome?: number
}

export interface BalanceSheetData {
  assets: {
    accountId: string
    accountName: string
    accountCode: string
    balance: number
    usdBalance?: number
    children?: BalanceSheetAccount[]
  }[]
  liabilities: {
    accountId: string
    accountName: string
    accountCode: string
    balance: number
    usdBalance?: number
    children?: BalanceSheetAccount[]
  }[]
  equity: {
    accountId: string
    accountName: string
    accountCode: string
    balance: number
    usdBalance?: number
    children?: BalanceSheetAccount[]
  }[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  usdTotalAssets?: number
  usdTotalLiabilities?: number
  usdTotalEquity?: number
}

export interface BalanceSheetAccount {
  accountId: string
  accountName: string
  accountCode: string
  balance: number
  usdBalance?: number
}

export interface CashFlowData {
  operatingActivities: {
    name: string
    amount: number
    usdAmount?: number
  }[]
  investingActivities: {
    name: string
    amount: number
    usdAmount?: number
  }[]
  financingActivities: {
    name: string
    amount: number
    usdAmount?: number
  }[]
  netCashFlow: number
  usdNetCashFlow?: number
}

export interface AgingBucket {
  label: string // 'Current', '1-30 days', '31-60 days', etc
  minDays: number
  maxDays: number
  total: number
  usdTotal?: number
  count: number
}

export interface AgingData {
  accountsPayable: {
    buckets: AgingBucket[]
    grandTotal: number
    usdGrandTotal?: number
    byVendor?: {
      vendorName: string
      buckets: AgingBucket[]
      total: number
    }[]
  }
  accountsReceivable: {
    buckets: AgingBucket[]
    grandTotal: number
    usdGrandTotal?: number
    byCustomer?: {
      customerName: string
      buckets: AgingBucket[]
      total: number
    }[]
  }
}

// Input Types
export interface CreateCOAInput {
  code: string
  name: string
  account_type: AccountType
  parent_id?: string
  description?: string
  normal_balance: BalanceType
}

export interface UpdateCOAInput extends Partial<CreateCOAInput> {
  id: string
}
