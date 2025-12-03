/**
 * Service Categories Settings Page
 *
 * Manage service category classifications for EAP services
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Briefcase, Plus, Edit, Trash2, ArrowLeft, X } from 'lucide-react'
import {
  useServiceCategories,
  useCreateServiceCategory,
  useUpdateServiceCategory,
  useDeleteServiceCategory,
  useServiceCategory,
} from '@/hooks/useServices'
import type { ServiceCategory, ServiceCategoryFormData } from '@/api/services'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField } from '@/components/forms/FormField'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormButton } from '@/components/forms/FormButton'
import { formatShortDate } from '@/utils/formatters'

export function ServiceCategoriesSettingsPage() {
  const { setPageTitle } = usePageTitle()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ServiceCategory | null>(null)

  const { data: categories = [], isLoading } = useServiceCategories()
  const createCategory = useCreateServiceCategory()
  const updateCategory = useUpdateServiceCategory()
  const deleteCategory = useDeleteServiceCategory()
  const { data: categoryDetail } = useServiceCategory(editingCategory?.id || '')

  useEffect(() => {
    setPageTitle('Service Categories', 'Manage EAP service classifications')
    return () => setPageTitle(null)
  }, [setPageTitle])

  const handleCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteCategory.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleSubmit = async (data: ServiceCategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data })
      } else {
        await createCategory.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingCategory(null)
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
            Add Category
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-400">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No service categories found</p>
              <button
                onClick={handleCreate}
                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Category
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Services</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 w-24 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">{category.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{category.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{category.service_count || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatShortDate(category.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(category)}
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
        <ServiceCategoryFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCategory(null)
          }}
          onSubmit={handleSubmit}
          initialData={
            editingCategory && categoryDetail
              ? {
                  name: categoryDetail.name,
                  description: categoryDetail.description || undefined,
                  metadata: categoryDetail.metadata || undefined,
                }
              : undefined
          }
          isLoading={createCategory.isPending || updateCategory.isPending}
          title={editingCategory ? 'Edit Service Category' : 'Add New Service Category'}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Service Category"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteCategory.isPending}
        />
      )}
    </AppLayout>
  )
}

// Service Category Form Modal Component
interface ServiceCategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServiceCategoryFormData) => Promise<void>
  initialData?: ServiceCategoryFormData
  isLoading?: boolean
  title?: string
}

function ServiceCategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  title = 'Add New Service Category',
}: ServiceCategoryFormModalProps) {
  const [formData, setFormData] = useState<ServiceCategoryFormData>({
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

  const handleChange = (field: keyof ServiceCategoryFormData, value: any) => {
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
          <div className="space-y-4">
            <FormField
              label="Category Name"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Counseling, Legal Assistance, Wellness"
              required
            />

            <FormTextarea
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value || undefined)}
              placeholder="Describe the category and types of services it includes..."
              rows={3}
            />
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
              {initialData ? 'Update Category' : 'Create Category'}
            </FormButton>
          </div>
        </form>
      </div>
    </div>
  )
}
