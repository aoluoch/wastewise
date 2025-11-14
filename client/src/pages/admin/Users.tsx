import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, AdminUser, PaginationInfo } from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    role: '',
    status: '',
    search: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers(filters);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      showToast({ message: 'Failed to load users', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusToggle = async (user: AdminUser) => {
    try {
      await adminApi.updateUserStatus(user._id, !user.isActive);
      showToast({
        message: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
      });
      fetchUsers();
    } catch {
      showToast({ message: 'Failed to update user status', type: 'error' });
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await adminApi.exportUsers(format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast({
        message: `Users exported as ${format.toUpperCase()} successfully`,
        type: 'success',
      });
    } catch {
      showToast({ message: 'Failed to export users', type: 'error' });
    }
  };

  const handleDeleteClick = (user: AdminUser) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteUser(userToDelete._id);
      showToast({ message: 'User deleted permanently', type: 'success' });
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch {
      showToast({ message: 'Failed to delete user', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'collector':
        return '👷';
      case 'resident':
        return '🏠';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'collector':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'resident':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4'></div>
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className='h-20 bg-gray-300 dark:bg-gray-700 rounded'
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            User Management
          </h1>
          <div className='flex space-x-2'>
            <button
              onClick={() => handleExport('csv')}
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Role
            </label>
            <select
              value={filters.role}
              onChange={e =>
                setFilters({ ...filters, role: e.target.value, page: 1 })
              }
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            >
              <option value=''>All Roles</option>
              <option value='admin'>Admin</option>
              <option value='collector'>Collector</option>
              <option value='resident'>Resident</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Status
            </label>
            <select
              value={filters.status}
              onChange={e =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            >
              <option value=''>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Search
            </label>
            <input
              type='text'
              placeholder='Search users...'
              value={filters.search}
              onChange={e =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Per Page
            </label>
            <select
              value={filters.limit}
              onChange={e =>
                setFilters({
                  ...filters,
                  limit: parseInt(e.target.value),
                  page: 1,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  User
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Phone
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Joined
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {users.map(user => (
                <tr
                  key={user._id}
                  className='hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='text-2xl mr-3'>
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className='text-sm font-medium text-gray-900 dark:text-white'>
                          {user.firstName} {user.lastName}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                    {user.phone || 'Not provided'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <div className='flex space-x-3'>
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`${
                          user.isActive
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-semibold'
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className='mt-6 flex items-center justify-between'>
            <div className='text-sm text-gray-700 dark:text-gray-300'>
              Showing{' '}
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{' '}
              of {pagination.totalItems} results
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={() =>
                  setFilters({ ...filters, page: pagination.currentPage - 1 })
                }
                disabled={pagination.currentPage === 1}
                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Previous
              </button>
              <span className='px-3 py-2 text-sm text-gray-700 dark:text-gray-300'>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setFilters({ ...filters, page: pagination.currentPage + 1 })
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center mb-4'>
              <div className='flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-red-600 dark:text-red-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
              </div>
              <h3 className='ml-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Delete User Permanently
              </h3>
            </div>

            <div className='mb-6'>
              <p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>
                Are you sure you want to permanently delete this user? This
                action cannot be undone.
              </p>
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <p className='text-sm font-medium text-red-800 dark:text-red-300 mb-2'>
                  User: {userToDelete.firstName} {userToDelete.lastName}
                </p>
                <p className='text-sm text-red-700 dark:text-red-400 mb-1'>
                  Email: {userToDelete.email}
                </p>
                <p className='text-sm text-red-700 dark:text-red-400'>
                  Role: {userToDelete.role}
                </p>
              </div>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-3'>
                ⚠️ This will also delete all associated data including reports,
                pickup tasks, and notifications.
              </p>
            </div>

            <div className='flex justify-end space-x-3'>
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className='px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
