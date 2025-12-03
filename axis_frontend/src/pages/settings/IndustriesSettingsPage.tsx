/**
 * Industries Settings Page
 *
 * Manage industry classifications and hierarchies
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Briefcase, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useIndustries, useCreateIndustry, useUpdateIndustry, useDeleteIndustry, useIndustry } from '@/hooks/useClients'
import type { Industry, IndustryFormData } from '@/api/clients'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField } from '@/components/forms/FormField'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormButton } from '@/components/forms/FormButton'
import { formatShortDate } from '@/utils/formatters'
import { X } from 'lucide-react'

export function IndustriesSettingsPage() {
  const { setPageTitle } = usePageTitle()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Industry | null>(null)

  const { data: industries = [], isLoading } = useIndustries()
  const createIndustry = useCreateIndustry()
  const updateIndustry = useUpdateIndustry()
  const deleteIndustry = useDeleteIndustry()
  const { data: industryDetail } = useIndustry(editingIndustry?.id || '')

  useEffect(() => {
    setPageTitle('Industries', 'Manage industry classifications')
    return () => setPageTitle(null)
  }, [setPageTitle])

  const handleCreate = () => {
    setEditingIndustry(null)
    setIsModalOpen(true)
  }

  const handleEdit = (industry: Industry) => {
    setEditingIndustry(industry)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteIndustry.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleSubmit = async (data: IndustryFormData) => {
    try {
      if (editingIndustry) {
        await updateIndustry.mutateAsync({ id: editingIndustry.id, data })
      } else {
        await createIndustry.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingIndustry(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Settings
          </button>
          <button
            onClick={handleCreate}
            className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Industry
          </button>
        </div>

        {/* Industries Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-400">Loading industries...</p>
            </div>
          ) : industries.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No industries found</p>
              <button
                onClick={handleCreate}
                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Industry
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 w-24 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {industries.map((industry) => (
                  <tr key={industry.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">{industry.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{industry.code || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{industry.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatShortDate(industry.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(industry)}
                          className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(industry)}
                          className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <IndustryFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingIndustry(null)
          }}
          onSubmit={handleSubmit}
          initialData={
            editingIndustry && industryDetail
              ? {
                  name: industryDetail.name,
                  code: industryDetail.code || undefined,
                  description: industryDetail.description || undefined,
                  parent_id: industryDetail.parent?.id || undefined,
                  external_id: industryDetail.external_id || undefined,
                  metadata: industryDetail.metadata || undefined,
                }
              : undefined
          }
          industries={industries}
          isLoading={createIndustry.isPending || updateIndustry.isPending}
          title={editingIndustry ? 'Edit Industry' : 'Add New Industry'}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Industry"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteIndustry.isPending}
        />
      )}
    </AppLayout>
  )
}

// Industry Form Modal Component
interface IndustryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: IndustryFormData) => Promise<void>
  initialData?: IndustryFormData
  industries: Industry[]
  isLoading?: boolean
  title?: string
}

function IndustryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  industries,
  isLoading = false,
  title = 'Add New Industry',
}: IndustryFormModalProps) {
  const [formData, setFormData] = useState<IndustryFormData>({
    name: '',
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({ name: '' })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (field: keyof IndustryFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-gray-900 border border-white/10 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Briefcase className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Industry Name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Healthcare"
                required
              />
            </div>

            <FormField
              label="Code"
              name="code"
              value={formData.code || ''}
              onChange={(e) => handleChange('code', e.target.value || undefined)}
              placeholder="e.g., NAICS 621"
            />

            <div className="md:col-span-2">
              <FormTextarea
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value || undefined)}
                placeholder="Describe the industry..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <FormButton type="submit" loading={isLoading}>
              {initialData ? 'Update Industry' : 'Create Industry'}
            </FormButton>
          </div>
        </form>
      </div>
    </div>
  )
}
