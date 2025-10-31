// PDF Export Service using jsPDF
// Note: Install with: npm install jspdf jspdf-autotable

import type { PnLData } from '../reports/pnl-report'
import type { BalanceSheetData } from '../reports/balance-sheet-report'

// This service provides export functionality
// In a real implementation, you would install jsPDF:
// npm install jspdf jspdf-autotable

export async function exportPnLToPDF(data: PnLData, period: string) {
  try {
    // Dynamic import to avoid build issues if library not installed
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.text('Demonstração do Resultado do Exercício (DRE)', 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Período: ${period}`, 14, 28)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34)
    
    // Revenues
    doc.setFontSize(14)
    doc.text('Receitas', 14, 45)
    
    const revenueRows = data.revenues.items.map(item => [
      item.account,
      formatCurrency(item.amount),
    ])
    revenueRows.push(['Total de Receitas', formatCurrency(data.revenues.total)])
    
    autoTable(doc, {
      startY: 50,
      head: [['Conta', 'Valor (BRL)']],
      body: revenueRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] },
    })
    
    // Expenses
    const finalY = (doc as any).lastAutoTable.finalY || 50
    doc.setFontSize(14)
    doc.text('Despesas', 14, finalY + 10)
    
    const expenseRows = data.expenses.items.map(item => [
      item.account,
      `(${formatCurrency(item.amount)})`,
    ])
    expenseRows.push(['Total de Despesas', `(${formatCurrency(data.expenses.total)})`])
    
    autoTable(doc, {
      startY: finalY + 15,
      head: [['Conta', 'Valor (BRL)']],
      body: expenseRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [239, 68, 68] },
    })
    
    // Net Income
    const finalY2 = (doc as any).lastAutoTable.finalY || 100
    doc.setFontSize(14)
    doc.text('Lucro Líquido', 14, finalY2 + 10)
    
    autoTable(doc, {
      startY: finalY2 + 15,
      body: [['Lucro Líquido do Período', formatCurrency(data.netIncome)]],
      theme: 'plain',
      styles: { fontSize: 12, fontStyle: 'bold', fillColor: data.netIncome >= 0 ? [34, 197, 94] : [239, 68, 68] },
    })
    
    // Save
    doc.save(`DRE_${period.replace('/', '-')}.pdf`)
    return true
  } catch (error) {
    console.error('Error exporting PDF:', error)
    alert('Para exportar PDF, instale as dependências: npm install jspdf jspdf-autotable')
    return false
  }
}

export async function exportBalanceSheetToPDF(data: BalanceSheetData, date: string) {
  try {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.text('Balanço Patrimonial', 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Data: ${new Date(date).toLocaleDateString('pt-BR')}`, 14, 28)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34)
    
    // ASSETS
    doc.setFontSize(14)
    doc.text('ATIVO', 14, 45)
    
    const assetRows = [
      ...data.assets.current.items.map(item => [item.account, formatCurrency(item.amount)]),
      ['Ativo Circulante', formatCurrency(data.assets.current.total)],
      ['', ''],
      ...data.assets.nonCurrent.items.map(item => [item.account, formatCurrency(item.amount)]),
      ['Ativo Não Circulante', formatCurrency(data.assets.nonCurrent.total)],
    ]
    
    autoTable(doc, {
      startY: 50,
      head: [['Conta', 'Valor (BRL)']],
      body: assetRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })
    
    const finalY = (doc as any).lastAutoTable.finalY
    autoTable(doc, {
      startY: finalY,
      body: [['TOTAL DO ATIVO', formatCurrency(data.assets.total)]],
      theme: 'plain',
      styles: { fontSize: 12, fontStyle: 'bold', fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    })
    
    // LIABILITIES + EQUITY (new page)
    doc.addPage()
    doc.setFontSize(14)
    doc.text('PASSIVO + PATRIMÔNIO LÍQUIDO', 14, 20)
    
    const liabilityRows = [
      ...data.liabilities.current.items.map(item => [item.account, formatCurrency(item.amount)]),
      ['Passivo Circulante', formatCurrency(data.liabilities.current.total)],
      ['', ''],
      ...data.liabilities.nonCurrent.items.map(item => [item.account, formatCurrency(item.amount)]),
      ['Passivo Não Circulante', formatCurrency(data.liabilities.nonCurrent.total)],
      ['', ''],
      ...data.equity.items.map(item => [item.account, formatCurrency(item.amount)]),
      ['Patrimônio Líquido', formatCurrency(data.equity.total)],
    ]
    
    autoTable(doc, {
      startY: 25,
      head: [['Conta', 'Valor (BRL)']],
      body: liabilityRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [239, 68, 68] },
    })
    
    const finalY2 = (doc as any).lastAutoTable.finalY
    autoTable(doc, {
      startY: finalY2,
      body: [['TOTAL PASSIVO + PL', formatCurrency(data.totalLiabilitiesAndEquity)]],
      theme: 'plain',
      styles: { fontSize: 12, fontStyle: 'bold', fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    })
    
    // Save
    doc.save(`Balanco_${date}.pdf`)
    return true
  } catch (error) {
    console.error('Error exporting PDF:', error)
    alert('Para exportar PDF, instale as dependências: npm install jspdf jspdf-autotable')
    return false
  }
}

export async function exportAgingReportToPDF(data: any, endDate: string) {
  try {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF('landscape')
    
    // Header
    doc.setFontSize(18)
    doc.text('Relatório de Aging - Envelhecimento de Contas', 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Data Base: ${new Date(endDate).toLocaleDateString('pt-BR')}`, 14, 28)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34)
    
    // Summary
    doc.setFontSize(14)
    doc.text('Resumo por Período', 14, 45)
    
    const summaryRows = data.buckets.map((bucket: any) => [
      bucket.label,
      formatCurrency(bucket.amount),
      `${bucket.percentage.toFixed(1)}%`,
    ])
    
    autoTable(doc, {
      startY: 50,
      head: [['Período', 'Valor (BRL)', '% do Total']],
      body: summaryRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })
    
    // Detailed table
    if (data.details && data.details.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(14)
      doc.text('Detalhamento', 14, finalY)
      
      const detailRows = data.details.map((detail: any) => [
        detail.reference,
        detail.description,
        new Date(detail.due_date).toLocaleDateString('pt-BR'),
        formatCurrency(detail.amount),
        detail.days_overdue > 0 ? `${detail.days_overdue} dias` : 'A vencer',
      ])
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Referência', 'Descrição', 'Vencimento', 'Valor', 'Status']],
        body: detailRows,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [71, 85, 105] },
      })
    }
    
    // Save
    doc.save(`Aging_Report_${endDate}.pdf`)
    return true
  } catch (error) {
    console.error('Error exporting PDF:', error)
    alert('Para exportar PDF, instale as dependências: npm install jspdf jspdf-autotable')
    return false
  }
}

export async function exportCashflowToPDF(data: any, period: string) {
  try {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.text('Fluxo de Caixa', 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Período: ${period}`, 14, 28)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34)
    
    // Summary
    const summaryRows = [
      ['Saldo Inicial', formatCurrency(data.initialBalance || 0)],
      ['Entradas', formatCurrency(data.inflows || 0)],
      ['Saídas', formatCurrency(data.outflows || 0)],
      ['Saldo Final', formatCurrency(data.finalBalance || 0)],
    ]
    
    autoTable(doc, {
      startY: 45,
      head: [['Item', 'Valor (BRL)']],
      body: summaryRows,
      theme: 'grid',
      styles: { fontSize: 11, fontStyle: 'bold' },
      headStyles: { fillColor: [59, 130, 246] },
    })
    
    // Save
    doc.save(`Cashflow_${period}.pdf`)
    return true
  } catch (error) {
    console.error('Error exporting PDF:', error)
    alert('Para exportar PDF, instale as dependências: npm install jspdf jspdf-autotable')
    return false
  }
}

// Helper function to download blob
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
}

