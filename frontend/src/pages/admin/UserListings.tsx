import { useState, useEffect, useMemo } from 'react';
import {  Ban, CheckCircle, Trash2, Users, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/adminApiServices';
import type { User, UserStats } from '@/types/user';

import { Table } from '@/components/table/Table';
import type { ColumnDef } from '@/components/table/types';
import { TableToolbar } from '@/components/table/TableToolbar';
import { TablePagination } from '@/components/table/TablePagination';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const ITEMS_PER_PAGE = 5;

type ActionType = 'block' | 'unblock' | 'delete';

const UserListing = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(page, ITEMS_PER_PAGE, search);
      setUsers(response.users);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await adminService.getUserStats();
      setStats(statsData);
    } catch {
      toast.error('Failed to fetch statistics');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleSearchApply = () => {
    setCurrentPage(1);
    fetchUsers(1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page, searchQuery);
  };

  const openConfirmModal = (user: User, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      setActionLoading(selectedUser.id);

      switch (actionType) {
        case 'block':
          await adminService.blockUser(selectedUser.id);
          toast.success('User blocked successfully');
          break;
        case 'unblock':
          await adminService.unblockUser(selectedUser.id);
          toast.success('User unblocked successfully');
          break;
        case 'delete':
          await adminService.deleteUser(selectedUser.id);
          toast.success('User deleted successfully');
          break;
      }

      closeModal();
      fetchUsers(currentPage, searchQuery);
      fetchStats();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${actionType} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const getUserRole = (user: User) => {
    if (user.role === 'admin') return { text: 'Admin', color: 'bg-purple-100 text-purple-800' };
    if (user.role === 'doctor') return { text: 'Doctor', color: 'bg-blue-100 text-blue-800' };
    return { text: 'User', color: 'bg-green-100 text-green-800' };
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getModalContent = () => {
    if (!selectedUser || !actionType) return { title: '', description: null, confirmText: '', danger: false };

    switch (actionType) {
      case 'block':
        return {
          title: 'Block User',
          description: (
            <>
              Are you sure you want to block <strong>{selectedUser.username}</strong>? 
              They will no longer be able to access their account.
            </>
          ),
          confirmText: actionLoading === selectedUser.id ? 'Blocking...' : 'Block User',
          danger: true,
        };
      case 'unblock':
        return {
          title: 'Unblock User',
          description: (
            <>
              Are you sure you want to unblock <strong>{selectedUser.username}</strong>? 
              They will regain access to their account.
            </>
          ),
          confirmText: actionLoading === selectedUser.id ? 'Unblocking...' : 'Unblock User',
          danger: false,
        };
      case 'delete':
        return {
          title: 'Delete User',
          description: (
            <>
              Are you sure you want to delete user <strong>{selectedUser.username}</strong>? 
              This action cannot be undone.
            </>
          ),
          confirmText: actionLoading === selectedUser.id ? 'Deleting...' : 'Delete User',
          danger: true,
        };
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: 'user',
      header: 'User',
      cell: (user) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (user) => {
        const role = getUserRole(user);
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${role.color}`}>
            {role.text}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
        >
          {user.isBlocked ? 'Blocked' : 'Active'}
        </span>
      ),
    },
    {
      id: 'joined',
      header: 'Joined',
      cell: (user) => <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: <div className="text-left">Actions</div>,
      cell: (user) => (
        <div className="flex items-center space-x-2">
          {user.isBlocked ? (
            <button
              onClick={() => openConfirmModal(user, 'unblock')}
              disabled={actionLoading === user.id || user.role === 'admin'}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Unblock
            </button>
          ) : (
            <button
              onClick={() => openConfirmModal(user, 'block')}
              disabled={actionLoading === user.id || user.role === 'admin'}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <Ban className="w-3 h-3 mr-1" />
              Block
            </button>
          )}
          {!(user.role === 'admin') && (
            <button
              onClick={() => openConfirmModal(user, 'delete')}
              disabled={actionLoading === user.id}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
          )}
        </div>
      ),
    },
  ], [actionLoading]);

  const leftText = `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(
    currentPage * ITEMS_PER_PAGE,
    total
  )} of ${total} users`;

  const modalContent = getModalContent();

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doctors</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <TableToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            onApply={handleSearchApply}
            title="Users Management"
            subtitle="Manage all users, doctors, and patients in your system"
          />
        </div>

        <div className="overflow-x-auto">
          <Table<User>
            columns={columns}
            data={users}
            loading={loading}
            emptyText="No users found"
            ariaColCount={columns.length}
            ariaRowCount={users.length}
            getRowKey={(u) => u.id}
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

      <ConfirmModal
        open={showModal && !!selectedUser}
        title={modalContent.title}
        description={modalContent.description}
        onClose={closeModal}
        onConfirm={handleConfirmAction}
        confirmText={modalContent.confirmText}
        danger={modalContent.danger}
      />
    </div>
  );
};

export default UserListing;