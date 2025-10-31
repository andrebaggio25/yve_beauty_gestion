import { createClient } from '@/lib/supabase/client'
import type { InvoiceTemplate, CreateInvoiceTemplateInput, UpdateInvoiceTemplateInput } from '@/types/billing'

const supabase = createClient()

export async function listInvoiceTemplates(language?: string): Promise<InvoiceTemplate[]> {
  let query = supabase
    .from('invoice_template')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (language) {
    query = query.eq('language', language)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getTemplateById(id: string): Promise<InvoiceTemplate | null> {
  const { data, error } = await supabase
    .from('invoice_template')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getDefaultTemplate(language: string = 'pt-BR'): Promise<InvoiceTemplate | null> {
  const { data, error } = await supabase
    .from('invoice_template')
    .select('*')
    .eq('language', language)
    .eq('is_default', true)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error) return null
  return data
}

export async function createInvoiceTemplate(input: CreateInvoiceTemplateInput): Promise<InvoiceTemplate> {
  // If setting as default, unset other defaults for same language
  if (input.is_default) {
    await supabase
      .from('invoice_template')
      .update({ is_default: false })
      .eq('language', input.language)
      .eq('is_default', true)
  }

  const payload = {
    name: input.name,
    description: input.description ?? null,
    template_json: input.template_json,
    language: input.language,
    is_default: input.is_default ?? false,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('invoice_template')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as InvoiceTemplate
}

export async function updateInvoiceTemplate(input: UpdateInvoiceTemplateInput): Promise<InvoiceTemplate> {
  const { id, ...rest } = input

  // If setting as default, unset other defaults for same language
  if (rest.is_default) {
    const template = await getTemplateById(id)
    if (template) {
      await supabase
        .from('invoice_template')
        .update({ is_default: false })
        .eq('language', template.language)
        .eq('is_default', true)
        .neq('id', id)
    }
  }

  const { data, error } = await supabase
    .from('invoice_template')
    .update(rest)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as InvoiceTemplate
}

export async function deactivateTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('invoice_template')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// Utility: Render template with data
export function renderTemplate(template: Record<string, any>, data: Record<string, any>): Record<string, any> {
  const rendered: Record<string, any> = {}

  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string') {
      // Replace placeholders like {{company.name}}
      rendered[key] = value.replace(/\{\{(.+?)\}\}/g, (match, path) => {
        const keys = path.split('.')
        let val: any = data
        for (const k of keys) {
          val = val?.[k]
        }
        return val ?? match
      })
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      rendered[key] = renderTemplate(value, data)
    } else if (Array.isArray(value)) {
      rendered[key] = value.map(item => 
        typeof item === 'object' ? renderTemplate(item, data) : item
      )
    } else {
      rendered[key] = value
    }
  }

  return rendered
}

// Utility: Validate template placeholders
export function validateTemplateStructure(template: Record<string, any>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const requiredFields = ['company', 'invoice', 'customer']
  const templateStr = JSON.stringify(template)

  for (const field of requiredFields) {
    if (!templateStr.includes(`{{${field}`)) {
      errors.push(`Template deve conter placeholders para '${field}'`)
    }
  }

  // Check for invoice number and total
  if (!templateStr.includes('{{invoice.invoice_number}}')) {
    errors.push("Template deve conter '{{invoice.invoice_number}}'")
  }
  if (!templateStr.includes('{{invoice.total_amount}}')) {
    errors.push("Template deve conter '{{invoice.total_amount}}'")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Default templates
export const DEFAULT_TEMPLATES = {
  'pt-BR': {
    name: 'Padrão PT-BR',
    description: 'Template padrão para faturas em português',
    language: 'pt-BR',
    template_json: {
      header: {
        logo: '{{company.logo}}',
        title: 'Fatura',
      },
      invoice_info: {
        number: 'Nº {{invoice.invoice_number}}',
        date: 'Data: {{invoice.issue_date}}',
        due_date: 'Vencimento: {{invoice.due_date}}',
      },
      company_info: {
        name: '{{company.name}}',
        email: '{{company.email}}',
        phone: '{{company.phone}}',
        address: '{{company.address}}',
      },
      customer_info: {
        label: 'Cliente:',
        name: '{{customer.legal_name}}',
        email: '{{customer.email}}',
        address: '{{customer.address}}',
      },
      items: {
        title: 'Itens',
        columns: ['Descrição', 'Quantidade', 'Valor Unitário', 'Total'],
      },
      totals: {
        subtotal: 'Subtotal: {{invoice.subtotal}}',
        tax: 'Imposto: {{invoice.tax_amount}}',
        total: 'Total: {{invoice.total_amount}}',
      },
      footer: {
        text: 'Obrigado pela confiança!',
      },
    },
  },
  'es-ES': {
    name: 'Estándar ES-ES',
    description: 'Plantilla estándar para facturas en español',
    language: 'es-ES',
    template_json: {
      header: {
        logo: '{{company.logo}}',
        title: 'Factura',
      },
      invoice_info: {
        number: 'Nº {{invoice.invoice_number}}',
        date: 'Fecha: {{invoice.issue_date}}',
        due_date: 'Vencimiento: {{invoice.due_date}}',
      },
      company_info: {
        name: '{{company.name}}',
        email: '{{company.email}}',
        phone: '{{company.phone}}',
        address: '{{company.address}}',
      },
      customer_info: {
        label: 'Cliente:',
        name: '{{customer.legal_name}}',
        email: '{{customer.email}}',
        address: '{{customer.address}}',
      },
      items: {
        title: 'Artículos',
        columns: ['Descripción', 'Cantidad', 'Precio Unitario', 'Total'],
      },
      totals: {
        subtotal: 'Subtotal: {{invoice.subtotal}}',
        tax: 'Impuesto: {{invoice.tax_amount}}',
        total: 'Total: {{invoice.total_amount}}',
      },
      footer: {
        text: '¡Gracias por su confianza!',
      },
    },
  },
  'en-US': {
    name: 'Standard EN-US',
    description: 'Standard template for invoices in English',
    language: 'en-US',
    template_json: {
      header: {
        logo: '{{company.logo}}',
        title: 'Invoice',
      },
      invoice_info: {
        number: 'Invoice #{{invoice.invoice_number}}',
        date: 'Date: {{invoice.issue_date}}',
        due_date: 'Due: {{invoice.due_date}}',
      },
      company_info: {
        name: '{{company.name}}',
        email: '{{company.email}}',
        phone: '{{company.phone}}',
        address: '{{company.address}}',
      },
      customer_info: {
        label: 'Bill To:',
        name: '{{customer.legal_name}}',
        email: '{{customer.email}}',
        address: '{{customer.address}}',
      },
      items: {
        title: 'Line Items',
        columns: ['Description', 'Quantity', 'Unit Price', 'Total'],
      },
      totals: {
        subtotal: 'Subtotal: {{invoice.subtotal}}',
        tax: 'Tax: {{invoice.tax_amount}}',
        total: 'Total: {{invoice.total_amount}}',
      },
      footer: {
        text: 'Thank you for your business!',
      },
    },
  },
}
