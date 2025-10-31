/**
 * English (US) Invoice Template
 */

export const invoiceTemplateEN = {
  // Header
  invoiceTitle: 'INVOICE',
  
  // Invoice metadata
  invoiceNo: 'Invoice No.',
  invoiceDate: 'Invoice Date:',
  issueDate: 'Issue Date:',
  dueDate: 'Due Date:',
  
  // Customer section
  billTo: 'Bill to:',
  
  // Table headers
  item: 'Item',
  quantity: 'Quantity',
  price: 'Price',
  discount: 'Discount',
  tax: 'Tax',
  total: 'Total',
  
  // Summary
  subtotal: 'Subtotal:',
  totalAmount: 'Total:',
  
  // Payment details
  paymentDetails: 'Payment Details:',
  name: 'Name',
  iban: 'IBAN',
  bic: 'BIC',
  bankName: 'Bank and Address',
  bank: 'Bank',
  bankAddress: 'Bank Address',
  
  // Footer
  thankYou: 'Thank you for your business!',
  questions: 'If you have any questions about this invoice, please contact us.',
  
  // Email subject and body
  emailSubject: (invoiceNumber: string) => `Invoice ${invoiceNumber}`,
  emailBody: (customerName: string, invoiceNumber: string, amount: string, dueDate: string) => `
    Dear ${customerName},

    Please find attached your invoice ${invoiceNumber}.

    Amount: ${amount}
    Due Date: ${dueDate}

    If you have any questions, please don't hesitate to contact us.

    Best regards,
    Your Company Name
  `,
}

export default invoiceTemplateEN

