/**
 * Export Utilities
 *
 * Utilities for exporting data to various formats (CSV, Excel, PDF)
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return ''

  // Create header row
  const headers = columns.map((col) => col.label).join(',')

  // Create data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const value = item[col.key]

        // Handle null/undefined
        if (value === null || value === undefined) return ''

        // Convert to string and escape
        let stringValue = String(value)

        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      })
      .join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Download data as CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  const csv = convertToCSV(data, columns)
  downloadCSV(csv, filename)
}

/**
 * Format date for export
 */
export function formatDateForExport(dateString: string | null | undefined): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Format datetime for export
 */
export function formatDateTimeForExport(dateString: string | null | undefined): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
