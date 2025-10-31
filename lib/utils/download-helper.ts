/**
 * Download Helper Utilities
 * Functions to handle file downloads in the browser
 */

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, filename)
}

/**
 * Download text as a file
 */
export function downloadText(text: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([text], { type: mimeType })
  downloadBlob(blob, filename)
}

/**
 * Download CSV data
 */
export function downloadCSV(data: any[], filename: string): void {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header]
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(','))
  ].join('\n')
  
  downloadText(csv, filename, 'text/csv')
}

