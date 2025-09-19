// src/pages/PetCategory.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { adminCategoryService, type AdminPetCategory } from '@/services/adminApiServices';

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

  const fetchCategories = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await adminCategoryService.list(page, ITEMS_PER_PAGE, search);
      setCategories(response.data);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
      await adminCategoryService.delete(selectedCategory._id);
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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminCategoryService.update(editing._id, form);
        toast.success('Category updated successfully');
      } else {
        await adminCategoryService.create(form);
        toast.success('Category created successfully');
      }
      setShowForm(false);
      fetchCategories(currentPage, searchQuery);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save category');
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          cat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
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
  ], []);

  const leftText = `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(
    currentPage * ITEMS_PER_PAGE,
    total
  )} of ${total} categories`;

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
            data={categories}
            loading={loading}
            emptyText="No categories found"
            ariaColCount={columns.length}
            ariaRowCount={categories.length}
            getRowKey={(c) => c._id}
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
                <input className="border rounded px-3 py-2 w-full" value={form.name} required
                       onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Icon Key (optional)</label>
                <input className="border rounded px-3 py-2 w-full" value={form.iconKey}
                       onChange={(e) => setForm({ ...form, iconKey: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Description (optional)</label>
                <textarea className="border rounded px-3 py-2 w-full" rows={3} value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm">Active</label>
                <input type="checkbox" checked={form.isActive}
                       onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Sort Order</label>
                <input type="number" className="border rounded px-3 py-2 w-full" value={form.sortOrder}
                       onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
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
            <>Are you sure you want to delete category <strong>{selectedCategory.name}</strong>? This action cannot be undone.</>
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
