import { createClient } from '@/lib/supabase/client'
import { differenceInDays } from 'date-fns'
import { convertToUSD } from '@/lib/utils/fx-service'
import type { AgingData, ReportFilters } from '@/types/reports'

const supabase = createClient()

const AGING_BUCKETS = [
  { label: 'Current', minDays: 0, maxDays: 0 },
  { label: '1-30 days', minDays: 1, maxDays: 30 },
  { label: '31-60 days', minDays: 31, maxDays: 60 },
  { label: '61-90 days', minDays: 61, maxDays: 90 },
  { label: '90+ days', minDays: 91, maxDays: 999 },
]

export async function generateAgingReport(filters: ReportFilters): Promise<AgingData> {
  const today = new Date()

  // Get AP records
  const { data: apRecords } = await supabase
    .from('accounts_payable')
    .select('id, due_date, amount, currency_code, usd_equiv_amount, status')
    .in('status', ['open', 'partial', 'overdue'])
    .lte('due_date', filters.endDate)

  // Get AR records
  const { data: arRecords } = await supabase
    .from('accounts_receivable')
    .select('id, due_date, amount, currency_code, usd_equiv_amount, status')
    .in('status', ['open', 'partial', 'overdue'])
    .lte('due_date', filters.endDate)

  // Process AP
  const apBuckets = AGING_BUCKETS.map(bucket => ({
    ...bucket,
    total: 0,
    usdTotal: filters.showUSD ? 0 : undefined,
    count: 0,
  }))

  let apGrandTotal = 0
  let apUsdGrandTotal = 0

  if (apRecords) {
    for (const record of apRecords) {
      const daysDue = differenceInDays(today, new Date(record.due_date))
      const bucket = apBuckets.find(b => daysDue >= b.minDays && daysDue <= b.maxDays)

      if (bucket) {
        bucket.total += record.original_amount
        if (filters.showUSD) {
          bucket.usdTotal! += record.usd_equiv_amount
        }
        bucket.count += 1
        apGrandTotal += record.original_amount
        apUsdGrandTotal += record.usd_equiv_amount
      }
    }
  }

  // Process AR
  const arBuckets = AGING_BUCKETS.map(bucket => ({
    ...bucket,
    total: 0,
    usdTotal: filters.showUSD ? 0 : undefined,
    count: 0,
  }))

  let arGrandTotal = 0
  let arUsdGrandTotal = 0

  if (arRecords) {
    for (const record of arRecords) {
      const daysDue = differenceInDays(today, new Date(record.due_date))
      const bucket = arBuckets.find(b => daysDue >= b.minDays && daysDue <= b.maxDays)

      if (bucket) {
        bucket.total += record.original_amount
        if (filters.showUSD) {
          bucket.usdTotal! += record.usd_equiv_amount
        }
        bucket.count += 1
        arGrandTotal += record.original_amount
        arUsdGrandTotal += record.usd_equiv_amount
      }
    }
  }

  return {
    accountsPayable: {
      buckets: apBuckets,
      grandTotal: apGrandTotal,
      usdGrandTotal: filters.showUSD ? apUsdGrandTotal : undefined,
    },
    accountsReceivable: {
      buckets: arBuckets,
      grandTotal: arGrandTotal,
      usdGrandTotal: filters.showUSD ? arUsdGrandTotal : undefined,
    },
  }
}

// Detailed aging by vendor/customer
export async function generateDetailedAgingReport(
  filters: ReportFilters,
  type: 'AP' | 'AR'
): Promise<AgingData> {
  const today = new Date()
  const baseReport = await generateAgingReport(filters)

  if (type === 'AP') {
    // Get AP with vendor details
    const { data: apDetails } = await supabase
      .from('accounts_payable')
      .select(`
        id,
        due_date,
        amount,
        currency_code,
        usd_equiv_amount,
        vendor:vendor_id(legal_name)
      `)
      .in('status', ['open', 'partial', 'overdue'])
      .lte('due_date', filters.endDate)

    const byVendor: Record<string, any> = {}

    if (apDetails) {
      for (const record of apDetails) {
        const vendorName = record.employee
          ? `${record.employee.first_name} ${record.employee.last_name}`
          : 'Unknown'
        const daysDue = differenceInDays(today, new Date(record.due_date))

        if (!byVendor[vendorName]) {
          byVendor[vendorName] = {
            vendorName,
            buckets: AGING_BUCKETS.map(b => ({ ...b, total: 0, usdTotal: 0, count: 0 })),
            total: 0,
          }
        }

        const bucket = byVendor[vendorName].buckets.find(
          (b: any) => daysDue >= b.minDays && daysDue <= b.maxDays
        )

        if (bucket) {
          bucket.total += record.original_amount
          if (filters.showUSD) {
            bucket.usdTotal += record.usd_equiv_amount
          }
          bucket.count += 1
          byVendor[vendorName].total += record.original_amount
        }
      }
    }

    return {
      ...baseReport,
      accountsPayable: {
        ...baseReport.accountsPayable,
        byVendor: Object.values(byVendor),
      },
    }
  } else {
    // Get AR with customer details
    const { data: arDetails } = await supabase
      .from('accounts_receivable')
      .select(`
        id,
        due_date,
        amount,
        currency_code,
        usd_equiv_amount,
        customer:customer_id(legal_name, trade_name)
      `)
      .in('status', ['open', 'partial', 'overdue'])
      .lte('due_date', filters.endDate)

    const byCustomer: Record<string, any> = {}

    if (arDetails) {
      for (const record of arDetails) {
        const customerName = record.customer?.legal_name || record.customer?.trade_name || 'Unknown'
        const daysDue = differenceInDays(today, new Date(record.due_date))

        if (!byCustomer[customerName]) {
          byCustomer[customerName] = {
            customerName,
            buckets: AGING_BUCKETS.map(b => ({ ...b, total: 0, usdTotal: 0, count: 0 })),
            total: 0,
          }
        }

        const bucket = byCustomer[customerName].buckets.find(
          (b: any) => daysDue >= b.minDays && daysDue <= b.maxDays
        )

        if (bucket) {
          bucket.total += record.original_amount
          if (filters.showUSD) {
            bucket.usdTotal += record.usd_equiv_amount
          }
          bucket.count += 1
          byCustomer[customerName].total += record.original_amount
        }
      }
    }

    return {
      ...baseReport,
      accountsReceivable: {
        ...baseReport.accountsReceivable,
        byCustomer: Object.values(byCustomer),
      },
    }
  }
}
