'use client'

import { useState, useCallback } from 'react'
import { calculateInvoiceTotal } from '@/modules/billing/invoices'
import type { CreateInvoiceLineInput } from '@/types/billing'

export interface InvoiceLineForm extends CreateInvoiceLineInput {
  id: string // temporary ID for UI
}

export interface InvoiceFormState {
  customerId: string
  contractId: string | null
  issueDate: string
  dueDate: string
  currency: string
  lines: InvoiceLineForm[]
  notes: string | null
  templateId: string | null
  language: string
  branchId: string | null
}

export function useInvoiceForm(initialState?: Partial<InvoiceFormState>) {
  const [state, setState] = useState<InvoiceFormState>({
    customerId: '',
    contractId: null,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'BRL',
    lines: [],
    notes: null,
    templateId: null,
    language: 'pt-BR',
    branchId: null,
    ...initialState,
  })

  const [totals, setTotals] = useState(() =>
    calculateInvoiceTotal(state.lines)
  )

  const updateField = useCallback((field: keyof InvoiceFormState, value: any) => {
    setState(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const addLine = useCallback(() => {
    const newLine: InvoiceLineForm = {
      id: `line-${Date.now()}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
    }

    setState(prev => {
      const updated = { ...prev, lines: [...prev.lines, newLine] }
      setTotals(calculateInvoiceTotal(updated.lines))
      return updated
    })
  }, [])

  const updateLine = useCallback((lineId: string, updates: Partial<InvoiceLineForm>) => {
    setState(prev => {
      const updatedLines = prev.lines.map(line =>
        line.id === lineId ? { ...line, ...updates } : line
      )
      setTotals(calculateInvoiceTotal(updatedLines))
      return { ...prev, lines: updatedLines }
    })
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setState(prev => {
      const updatedLines = prev.lines.filter(line => line.id !== lineId)
      setTotals(calculateInvoiceTotal(updatedLines))
      return { ...prev, lines: updatedLines }
    })
  }, [])

  const reset = useCallback(() => {
    setState({
      customerId: '',
      contractId: null,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'BRL',
      lines: [],
      notes: null,
      templateId: null,
      language: 'pt-BR',
      branchId: null,
      ...initialState,
    })
    setTotals(calculateInvoiceTotal([]))
  }, [initialState])

  return {
    state,
    totals,
    updateField,
    addLine,
    updateLine,
    removeLine,
    reset,
  }
}
