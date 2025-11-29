/**
 * CSV Parser Utilities
 *
 * SOLID Principles:
 * - Single Responsibility: Parse and validate CSV files
 * - Open/Closed: Extensible with additional file formats
 */

// import * as XLSX from 'xlsx'

export interface ClientBulkRow {
  name: string
  email?: string
  phone?: string
  website?: string
  address?: string
  billing_address?: string
  timezone?: string
  tax_id?: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
  industry_id?: string
  status?: string
  preferred_contact_method?: string
  is_verified?: string | boolean
  notes?: string
}

export interface EmployeeBulkRow {
  client_id: string
  full_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address?: string
  city?: string
  country?: string
  employee_department?: string
  employee_id_number?: string
  employment_status?: string
  employment_start_date?: string
  job_title?: string
}

/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<ClientBulkRow[] | EmployeeBulkRow[]> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.csv')) {
      reject(new Error('Invalid file type. Please upload a .csv file.'))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('Failed to read file'))
          return
        }

        let rows: any[] = []

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string
          const lines = text.split('\n').filter((line) => line.trim())
          if (lines.length < 2) {
            reject(new Error('File must contain at least a header row and one data row'))
            return
          }

          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
          rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim())
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            return row
          })
        }
        // else {
        //   // Parse Excel
        //   const workbook = XLSX.read(data, { type: 'binary' })
        //   const sheetName = workbook.SheetNames[0]
        //   const worksheet = workbook.Sheets[sheetName]
        //   rows = XLSX.utils.sheet_to_json(worksheet, { raw: false })
        // }

        // Filter out empty rows
        rows = rows.filter((row) => {
          return Object.values(row).some((value) => value && String(value).trim())
        })

        resolve(rows as ClientBulkRow[] | EmployeeBulkRow[])
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reject(new Error('Unsupported file type. Only .csv files are supported.'))
    }
  })
}

/**
 * Validate client row data
 */
export function validateClientRow(row: ClientBulkRow, rowNumber: number): string[] {
  const errors: string[] = []

  // Required fields
  if (!row.name || !row.name.trim()) {
    errors.push(`Row ${rowNumber}: Name is required`)
  }

  // Email validation
  if (row.email && row.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(row.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`)
    }
  }

  // URL validation
  if (row.website && row.website.trim()) {
    try {
      new URL(row.website)
    } catch {
      errors.push(`Row ${rowNumber}: Invalid website URL`)
    }
  }

  // Boolean conversion for is_verified
  if (row.is_verified !== undefined) {
    const value = String(row.is_verified).toLowerCase()
    if (!['true', 'false', '1', '0', 'yes', 'no', ''].includes(value)) {
      errors.push(`Row ${rowNumber}: is_verified must be true/false`)
    }
  }

  return errors
}

/**
 * Validate employee row data
 */
export function validateEmployeeRow(row: EmployeeBulkRow, rowNumber: number): string[] {
  const errors: string[] = []

  // Required fields
  if (!row.client_id || !row.client_id.trim()) {
    errors.push(`Row ${rowNumber}: Client ID is required`)
  }

  if (!row.full_name || !row.full_name.trim()) {
    errors.push(`Row ${rowNumber}: Full name is required`)
  }

  // Email validation
  if (row.email && row.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(row.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`)
    }
  }

  // Date validation
  if (row.date_of_birth && row.date_of_birth.trim()) {
    const date = new Date(row.date_of_birth)
    if (isNaN(date.getTime())) {
      errors.push(`Row ${rowNumber}: Invalid date_of_birth format (use YYYY-MM-DD)`)
    }
  }

  if (row.employment_start_date && row.employment_start_date.trim()) {
    const date = new Date(row.employment_start_date)
    if (isNaN(date.getTime())) {
      errors.push(`Row ${rowNumber}: Invalid employment_start_date format (use YYYY-MM-DD)`)
    }
  }

  return errors
}

