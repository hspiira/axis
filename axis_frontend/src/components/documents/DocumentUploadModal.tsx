/**
 * Document Upload Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle document upload with metadata
 * - Open/Closed: Can be extended with additional upload features
 */

import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Link as LinkIcon, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseModal } from '@/components/ui'
import { FormButton } from '@/components/forms/FormButton'
import { FormField } from '@/components/forms/FormField'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormTextarea } from '@/components/forms/FormTextarea'
import type { DocumentCreateInput, DocumentType } from '@/api/documents'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DocumentCreateInput) => Promise<void>
  clientId?: string | null
  contractId?: string | null
  isLoading?: boolean
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'certification', label: 'Certification' },
  { value: 'kpi_report', label: 'KPI Report' },
  { value: 'feedback_summary', label: 'Feedback Summary' },
  { value: 'billing_report', label: 'Billing Report' },
  { value: 'utilization_report', label: 'Utilization Report' },
  { value: 'other', label: 'Other' },
]

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSubmit,
  clientId,
  contractId,
  isLoading = false,
}: DocumentUploadModalProps) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const [formData, setFormData] = useState<Partial<DocumentCreateInput>>({
    title: '',
    type: 'other',
    description: '',
    url: '',
    is_confidential: false,
    tags: [],
    expiry_date: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setFormData({
        title: '',
        type: 'other',
        description: '',
        url: '',
        is_confidential: false,
        tags: [],
        expiry_date: '',
      })
      setSelectedFile(null)
      setTagInput('')
      setUploadMethod('file')
    }
  }, [isOpen])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }))
      }
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title?.trim()) {
      alert('Please enter a document title')
      return
    }

    if (uploadMethod === 'file' && !selectedFile) {
      alert('Please select a file to upload')
      return
    }

    if (uploadMethod === 'url' && !formData.url?.trim()) {
      alert('Please enter a document URL')
      return
    }

    // Get user ID from localStorage (from auth token)
    const token = localStorage.getItem('auth_access_token')
    if (!token) {
      alert('You must be logged in to upload documents')
      return
    }

    // Decode user ID from token
    let userId = ''
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]))
        userId = payload.user_id || payload.sub || ''
      }
    } catch (error) {
      console.error('Failed to decode user ID from token:', error)
      alert('Failed to get user information')
      return
    }

    if (!userId) {
      alert('Failed to get user information')
      return
    }

    const submitData: DocumentCreateInput = {
      title: formData.title!,
      type: formData.type!,
      uploaded_by_id: userId,
      description: formData.description || undefined,
      is_confidential: formData.is_confidential || false,
      tags: formData.tags || [],
      expiry_date: formData.expiry_date || undefined,
      client_id: clientId || undefined,
      contract_id: contractId || undefined,
    }

    if (uploadMethod === 'file' && selectedFile) {
      submitData.file = selectedFile
    } else if (uploadMethod === 'url' && formData.url) {
      submitData.url = formData.url
    }

    await onSubmit(submitData)
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Document"
      isLoading={isLoading}
      bgColor="bg-[#100f0a]"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Upload Method Selection */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={cn(
                'flex-1 p-4 border rounded-lg transition-all',
                uploadMethod === 'file'
                  ? 'border-cream-500 bg-amber-500/10 text-cream-400'
                  : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
              )}
            >
              <Upload className="h-5 w-5 mx-auto mb-2" />
              <span className="text-sm font-medium">Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('url')}
              className={cn(
                'flex-1 p-4 border rounded-lg transition-all',
                uploadMethod === 'url'
                  ? 'border-cream-500 bg-amber-500/10 text-cream-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              )}
            >
              <LinkIcon className="h-5 w-5 mx-auto mb-2" />
              <span className="text-sm font-medium">From URL</span>
            </button>
          </div>

          {/* File Upload */}
          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">File</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
                  selectedFile
                    ? 'border-cream-500/50 bg-amber-500/5'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-cream-400 mx-auto" />
                    <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400">Click to select a file</p>
                    <p className="text-xs text-gray-500">or drag and drop</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL Input */}
          {uploadMethod === 'url' && (
            <FormField
              label="Document URL"
              value={formData.url || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com/document.pdf"
              disabled={isLoading}
              required
            />
          )}

          {/* Title */}
          <FormField
            label="Title"
            value={formData.title || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Document title"
            disabled={isLoading}
            required
          />

          {/* Type */}
          <FormSelect
            label="Document Type"
            value={formData.type || 'other'}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as DocumentType }))}
            disabled={isLoading}
            required
            options={DOCUMENT_TYPES.map((type) => ({
              value: type.value,
              label: type.label,
            }))}
          />

          {/* Description */}
          <FormTextarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
            disabled={isLoading}
            rows={3}
          />

          {/* Expiry Date */}
          <FormField
            label="Expiry Date (Optional)"
            type="date"
            value={formData.expiry_date || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
            disabled={isLoading}
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                disabled={isLoading}
                className="flex-1 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50"
              />
              <FormButton
                type="button"
                variant="secondary"
                onClick={handleAddTag}
                disabled={isLoading || !tagInput.trim()}
              >
                Add
              </FormButton>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-cream-500/20 text-cream-400 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isLoading}
                      className="hover:text-yellow-300"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Confidential */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_confidential"
              checked={formData.is_confidential || false}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_confidential: e.target.checked }))}
              disabled={isLoading}
              className="w-4 h-4 text-amber-600 bg-white/5 border-white/10 rounded focus:ring-cream-500"
            />
            <label htmlFor="is_confidential" className="text-sm text-gray-400">
              Mark as confidential
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <FormButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              fullWidth
            >
              Cancel
            </FormButton>
            <FormButton type="submit" variant="primary" loading={isLoading} fullWidth>
              Upload Document
            </FormButton>
          </div>
        </form>
    </BaseModal>
  )
}

