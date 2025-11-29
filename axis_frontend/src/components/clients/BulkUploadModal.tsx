/**
 * Bulk Upload Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle bulk client upload via CSV/Excel
 * - Open/Closed: Extensible with additional file formats
 * - Dependency Inversion: Depends on API abstraction
 */

import { useState, useCallback } from 'react'
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseCSV, validateClientRow, type ClientBulkRow } from '@/utils/csvParser'
import { BulkUploadPreview } from './BulkUploadPreview'
import { BulkUploadProgress } from './BulkUploadProgress'
import { BulkUploadResults } from './BulkUploadResults'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type UploadStep = 'upload' | 'preview' | 'uploading' | 'results'

interface UploadResult {
  row: number
  success: boolean
  message?: string
  data?: any
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ClientBulkRow[]>([])
  const [validationErrors, setValidationErrors] = useState<Map<number, string[]>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validExtensions = ['.csv', '.xlsx', '.xls']

    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))
    const isValidType =
      validTypes.includes(selectedFile.type) || validExtensions.includes(fileExtension)

    if (!isValidType) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }

    setFile(selectedFile)

    try {
      // Parse file
      const data = await parseCSV(selectedFile)
      setParsedData(data)

      // Validate each row
      const errors = new Map<number, string[]>()
      data.forEach((row, index) => {
        const rowErrors = validateClientRow(row, index + 2) // +2 for header and 1-based indexing
        if (rowErrors.length > 0) {
          errors.set(index, rowErrors)
        }
      })

      setValidationErrors(errors)

      // Move to preview step if data is valid
      if (errors.size === 0) {
        setStep('preview')
      } else {
        // Show preview with errors highlighted
        setStep('preview')
      }
    } catch (error) {
      alert(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setFile(null)
      setParsedData([])
    }
  }, [])

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  // Download template
  const handleDownloadTemplate = useCallback(() => {
    // Generate CSV template
    const headers = [
      'name',
      'email',
      'phone',
      'website',
      'address',
      'billing_address',
      'timezone',
      'tax_id',
      'contact_person',
      'contact_email',
      'contact_phone',
      'industry_id',
      'status',
      'preferred_contact_method',
      'is_verified',
      'notes',
    ]
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'client_bulk_upload_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }, [])

  // Handle bulk upload
  const handleBulkUpload = useCallback(async () => {
    if (parsedData.length === 0) return

    setStep('uploading')
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // TODO: Replace with actual API call when backend is ready
      // const results = await clientsApi.bulkCreate(parsedData)
      
      // Simulate upload progress
      const results: UploadResult[] = []
      const totalRows = parsedData.length
      
      for (let i = 0; i < totalRows; i++) {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 100))
        
        // Simulate success/failure (90% success rate for demo)
        const success = Math.random() > 0.1
        results.push({
          row: i + 2, // +2 for header and 1-based indexing
          success,
          message: success ? 'Client created successfully' : 'Failed to create client',
          data: success ? { id: `client-${i}`, name: parsedData[i].name } : undefined,
        })
        
        setUploadProgress(((i + 1) / totalRows) * 100)
      }

      setUploadResults(results)
      setStep('results')
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }, [parsedData])

  // Reset modal
  const handleReset = useCallback(() => {
    setFile(null)
    setParsedData([])
    setValidationErrors(new Map())
    setUploadResults([])
    setUploadProgress(0)
    setStep('upload')
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    if (isProcessing) return // Prevent closing during upload
    handleReset()
    onClose()
  }, [isProcessing, handleReset, onClose])

  // Handle success
  const handleSuccess = useCallback(() => {
    handleReset()
    onSuccess()
    onClose()
  }, [handleReset, onSuccess, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Bulk Upload Clients</h2>
            <p className="text-sm text-gray-400 mt-1">
              Upload multiple clients via CSV or Excel file
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-emerald-400 mb-2">Upload Instructions</h3>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Download the template file to see the required format</li>
                      <li>Fill in client information (name is required)</li>
                      <li>Upload CSV or Excel file (.csv, .xlsx, .xls)</li>
                      <li>Maximum file size: 10MB</li>
                      <li>Review and validate data before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download Template */}
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Download Template</p>
                    <p className="text-xs text-gray-400">Get the CSV template with all required fields</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>

              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
                  'border-white/20 hover:border-emerald-500/50 bg-white/5 hover:bg-white/[0.07]',
                  'cursor-pointer'
                )}
                onClick={() => document.getElementById('bulk-upload-file-input')?.click()}
              >
                <input
                  id="bulk-upload-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) {
                      handleFileSelect(selectedFile)
                    }
                  }}
                />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-white mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Supports CSV and Excel files (.csv, .xlsx, .xls)
                </p>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-gray-500">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <BulkUploadPreview
              data={parsedData}
              validationErrors={validationErrors}
              onEdit={(index, field, value) => {
                // Allow inline editing
                const updated = [...parsedData]
                updated[index] = { ...updated[index], [field]: value }
                setParsedData(updated)
                
                // Re-validate
                const errors = validateClientRow(updated[index], index + 2)
                const newErrors = new Map(validationErrors)
                if (errors.length > 0) {
                  newErrors.set(index, errors)
                } else {
                  newErrors.delete(index)
                }
                setValidationErrors(newErrors)
              }}
              onBack={() => {
                setStep('upload')
                setFile(null)
                setParsedData([])
                setValidationErrors(new Map())
              }}
              onUpload={handleBulkUpload}
              canUpload={validationErrors.size === 0 && parsedData.length > 0}
            />
          )}

          {step === 'uploading' && (
            <BulkUploadProgress
              total={parsedData.length}
              progress={uploadProgress}
            />
          )}

          {step === 'results' && (
            <BulkUploadResults
              results={uploadResults}
              onClose={handleClose}
              onUploadMore={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  )
}

