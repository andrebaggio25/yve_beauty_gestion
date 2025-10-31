/**
 * Portuguese (Brazil) Invoice Template
 */

export const invoiceTemplatePT = {
  // Header
  invoiceTitle: 'FATURA',
  
  // Invoice metadata
  invoiceNo: 'Fatura Nº',
  invoiceDate: 'Data da Fatura:',
  issueDate: 'Data de Emissão:',
  dueDate: 'Data de Vencimento:',
  
  // Customer section
  billTo: 'Faturar para:',
  
  // Table headers
  item: 'Item',
  quantity: 'Quantidade',
  price: 'Preço',
  discount: 'Desconto',
  tax: 'Imposto',
  total: 'Total',
  
  // Summary
  subtotal: 'Subtotal:',
  totalAmount: 'Total:',
  
  // Payment details
  paymentDetails: 'Detalhes de Pagamento:',
  name: 'Nome',
  iban: 'IBAN',
  bic: 'BIC',
  bankName: 'Banco e Endereço',
  bank: 'Banco',
  bankAddress: 'Endereço do Banco',
  
  // Footer
  thankYou: 'Obrigado pelo seu negócio!',
  questions: 'Se você tiver alguma dúvida sobre esta fatura, entre em contato conosco.',
  
  // Email subject and body
  emailSubject: (invoiceNumber: string) => `Fatura ${invoiceNumber}`,
  emailBody: (customerName: string, invoiceNumber: string, amount: string, dueDate: string) => `
    Prezado(a) ${customerName},

    Segue em anexo sua fatura ${invoiceNumber}.

    Valor: ${amount}
    Data de Vencimento: ${dueDate}

    Se tiver alguma dúvida, não hesite em nos contatar.

    Atenciosamente,
    Nome da Sua Empresa
  `,
}

export default invoiceTemplatePT

