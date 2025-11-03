// src/pages/PetCategory.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { adminCategoryService } from '@/services/adminApiServices';
import type { AdminPetCategory } from '@/types/adminCategory.types';

import { Table } from '@/components/table/Table';
import type { ColumnDef } from '@/components/table/types';
import { TableToolbar } from '@/components/table/TableToolbar';
import { TablePagination } from '@/components/table/TablePagination';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Button } from '@/components/UiComponents/button';
import { Edit, Trash2, PlusCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 3;

const PetCategory = () => {
  const [categories, setCategories] = useState<AdminPetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<AdminPetCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminPetCategory | null>(null);
  const [form, setForm] = useState({
    name: '',
    iconKey: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  const normalizeListResponse = (resp: any) => {
    // Expecting { data: Category[], page, totalPages, total }
    if (resp?.data?.data) return resp.data; // when wrapped by ApiResponse
    return resp;
  };

  const fetchCategories = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await adminCategoryService.list(page, ITEMS_PER_PAGE, search);
      const payload = normalizeListResponse(response);
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setCategories(rows);
      console.log("Fetched categories rows:", rows);
      setCurrentPage(Number(payload?.page) || page);
      setTotalPages(Number(payload?.totalPages) || 1);
      setTotal(Number(payload?.total) || rows.length);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearchApply = () => {
    setCurrentPage(1);
    fetchCategories(1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCategories(page, searchQuery);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      await adminCategoryService.delete(selectedCategory.id);
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      fetchCategories(currentPage, searchQuery);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete category');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', iconKey: '', description: '', isActive: true, sortOrder: 0 });
    setShowForm(true);
  };

  const openEdit = (cat: AdminPetCategory) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      iconKey: cat.iconKey || '',
      description: cat.description || '',
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  };

  // Lightweight client-side validation and duplicate guard
  const validateForm = () => {
    const errors: string[] = [];
    const name = form.name.trim();
    if (name.length < 2) errors.push('Name must be at least 2 characters');
    if (name.length > 60) errors.push('Name must be at most 60 characters');
    if (form.iconKey && form.iconKey.length > 120) errors.push('Icon key too long');
    if (form.description && form.description.length > 500) errors.push('Description too long');
    if (!Number.isInteger(form.sortOrder) || form.sortOrder < 0) {
      errors.push('Sort order must be a non-negative integer');
    }
    // Local duplicate check among currently loaded categories (case-insensitive)
    const localDup = categories.some(
      (c) => c.id !== editing?.id && c.name.toLowerCase() === name.toLowerCase()
    );
    if (localDup) errors.push('Category name already exists (case-insensitive)');

    return { valid: errors.length === 0, errors, clean: { ...form, name } };
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, errors, clean } = validateForm();
    if (!valid) {
      errors.forEach((m) => toast.error(m));
      return;
    }

    try {
      if (editing) {
        await adminCategoryService.update(editing.id, {
          ...clean,
          iconKey: clean.iconKey?.trim() || undefined,
          description: clean.description?.trim() || undefined,
        });
        toast.success('Category updated successfully');
      } else {
        await adminCategoryService.create({
          ...clean,
          iconKey: clean.iconKey?.trim() || undefined,
          description: clean.description?.trim() || undefined,
        });
        toast.success('Category created successfully');
      }
      setShowForm(false);
      fetchCategories(currentPage, searchQuery);
    } catch (error: any) {
      const msg =
        error?.response?.status === 409
          ? 'Category name already exists (case-insensitive)'
          : error?.response?.data?.message || 'Failed to save category';
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<AdminPetCategory>[]>(() => [
    {
      id: 'name',
      header: 'Name',
      cell: (cat) => <span className="font-medium">{cat.name}</span>,
    },
    {
      id: 'active',
      header: 'Active',
      cell: (cat) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            cat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {cat.isActive ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      id: 'sort',
      header: 'Sort Order',
      cell: (cat) => <span>{cat.sortOrder}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (cat) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openEdit(cat)}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </button>
          <button
            onClick={() => {
              setSelectedCategory(cat);
              setShowDeleteModal(true);
            }}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </button>
        </div>
      ),
    },
  ], [categories, editing]);

  const leftText = `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(
    currentPage * ITEMS_PER_PAGE,
    total
  )} of ${total} categories`;

  const isSubmitDisabled = form.name.trim().length < 2 || !Number.isInteger(form.sortOrder) || form.sortOrder < 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <TableToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            onApply={handleSearchApply}
            title="Pet Categories"
            subtitle="Manage all pet categories in the system"
          />
          <Button onClick={openCreate} className="ml-4 flex items-center">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table<AdminPetCategory>
            columns={columns}
            data={Array.isArray(categories) ? categories : []}
            loading={loading}
            emptyText="No categories found"
            ariaColCount={columns.length}
            ariaRowCount={Array.isArray(categories) ? categories.length : 0}
            getRowKey={(c) => c.id}
            renderLoadingRow={() => (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            )}
          />
        </div>

        {totalPages > 1 && (
          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            onPrev={() => handlePageChange(Math.max(1, currentPage - 1))}
            onNext={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            leftText={leftText}
          />
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <h2 className="text-lg font-semibold mb-3">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Name</label>
                <input
                  className="border rounded px-3 py-2 w/full"
                  value={form.name}
                  required
                  minLength={2}
                  maxLength={60}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Icon Key (optional)</label>
                <input
                  className="border rounded px-3 py-2 w/full"
                  value={form.iconKey}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, iconKey: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Description (optional)</label>
                <textarea
                  className="border rounded px-3 py-2 w/full"
                  rows={3}
                  value={form.description}
                  maxLength={500}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm">Active</label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Sort Order</label>
                <input
                  type="number"
                  className="border rounded px-3 py-2 w/full"
                  value={form.sortOrder}
                  min={0}
                  step={1}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Math.max(0, parseInt(e.target.value || '0', 10)) })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitDisabled}>
                  {editing ? 'Save' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        open={showDeleteModal && !!selectedCategory}
        title="Delete Category"
        description={
          selectedCategory ? (
            <>
              Are you sure you want to delete category <strong>{selectedCategory.name}</strong>? This action cannot be undone.
            </>
          ) : null
        }
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteCategory}
        confirmText="Delete"
        danger
      />
    </div>
  );
};

export default PetCategory;
