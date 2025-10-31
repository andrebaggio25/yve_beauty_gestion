/**
 * Spanish (Spain) Invoice Template
 */

export const invoiceTemplateES = {
  // Header
  invoiceTitle: 'FACTURA',
  
  // Invoice metadata
  invoiceNo: 'Factura Nº',
  invoiceDate: 'Fecha de Factura:',
  issueDate: 'Fecha de Emisión:',
  dueDate: 'Fecha de Vencimiento:',
  
  // Customer section
  billTo: 'Facturar a:',
  
  // Table headers
  item: 'Artículo',
  quantity: 'Cantidad',
  price: 'Precio',
  discount: 'Descuento',
  tax: 'Impuesto',
  total: 'Total',
  
  // Summary
  subtotal: 'Subtotal:',
  totalAmount: 'Total:',
  
  // Payment details
  paymentDetails: 'Detalles de Pago:',
  name: 'Nombre',
  iban: 'IBAN',
  bic: 'BIC',
  bankName: 'Banco y Dirección',
  bank: 'Banco',
  bankAddress: 'Dirección del Banco',
  
  // Footer
  thankYou: '¡Gracias por su negocio!',
  questions: 'Si tiene alguna pregunta sobre esta factura, póngase en contacto con nosotros.',
  
  // Email subject and body
  emailSubject: (invoiceNumber: string) => `Factura ${invoiceNumber}`,
  emailBody: (customerName: string, invoiceNumber: string, amount: string, dueDate: string) => `
    Estimado/a ${customerName},

    Adjunto encontrará su factura ${invoiceNumber}.

    Importe: ${amount}
    Fecha de Vencimiento: ${dueDate}

    Si tiene alguna pregunta, no dude en contactarnos.

    Atentamente,
    Nombre de Su Empresa
  `,
}

export default invoiceTemplateES

