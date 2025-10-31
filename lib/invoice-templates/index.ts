/**
 * Invoice Template Selector
 * Returns the appropriate template based on language
 */

import invoiceTemplateEN from './en-US'
import invoiceTemplatePT from './pt-BR'
import invoiceTemplateES from './es-ES'

export type InvoiceTemplate = typeof invoiceTemplateEN

export function getInvoiceTemplate(language: string): InvoiceTemplate {
  switch (language.toLowerCase()) {
    case 'en-us':
    case 'en':
    case 'english':
      return invoiceTemplateEN
    
    case 'pt-br':
    case 'pt':
    case 'portuguese':
      return invoiceTemplatePT
    
    case 'es-es':
    case 'es':
    case 'spanish':
      return invoiceTemplateES
    
    default:
      // Default to English
      return invoiceTemplateEN
  }
}

export { invoiceTemplateEN, invoiceTemplatePT, invoiceTemplateES }

