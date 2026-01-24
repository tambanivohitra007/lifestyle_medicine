import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users as UsersIcon, Edit, Trash2, RotateCcw, UserCheck, UserX, Shield, PenTool, Eye } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Swal from 'sweetalert2';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter !== '') params.append('is_active', statusFilter);

      const response = await api.get(`${apiEndpoints.users}?${params.toString()}`);
      setUsers(response.data.data);
      setPagination(response.data.meta || {});
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = await confirmDelete(user.name);
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.users}/${user.id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleActive = async (user) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User?`,
      text: `Are you sure you want to ${action} "${user.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: user.is_active ? '#dc2626' : '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}`,
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(apiEndpoints.userToggleActive(user.id));
      toast.success(`User ${action}d`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(`Failed to ${action} user`);
      }
    }
  };

  const handleRestore = async (user) => {
    const result = await Swal.fire({
      title: 'Restore User?',
      text: `Are you sure you want to restore "${user.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore',
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(apiEndpoints.userRestore(user.id));
      toast.success('User restored');
      fetchUsers();
    } catch (error) {
      console.error('Error restoring user:', error);
      toast.error('Failed to restore user');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { icon: Shield, class: 'bg-purple-100 text-purple-700' },
      editor: { icon: PenTool, class: 'bg-blue-100 text-blue-700' },
      viewer: { icon: Eye, class: 'bg-gray-100 text-gray-700' },
    };
    const badge = badges[role] || badges.viewer;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (isActive, isDeleted) => {
    if (isDeleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <Trash2 className="w-3 h-3" />
          Deleted
        </span>
      );
    }
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <UserCheck className="w-3 h-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <UserX className="w-3 h-3" />
        Inactive
      </span>
    );
  };

  const filteredUsers = users;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage user accounts and permissions
          </p>
        </div>
        <Link to="/users/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <UsersIcon className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || roleFilter || statusFilter ? 'No users found' : 'No users yet'}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            {searchTerm || roleFilter || statusFilter
              ? 'Try adjusting your filters'
              : 'Get started by creating a new user'}
          </p>
          {!searchTerm && !roleFilter && !statusFilter && (
            <Link to="/users/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add User
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Created
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={user.deleted_at ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-semibold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          {/* Mobile badges */}
                          <div className="flex flex-wrap gap-2 mt-1 sm:hidden">
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.is_active, user.deleted_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      {getStatusBadge(user.is_active, user.deleted_at)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {user.deleted_at ? (
                          <button
                            onClick={() => handleRestore(user)}
                            className="action-btn hover:bg-green-50"
                            title="Restore"
                          >
                            <RotateCcw className="w-4 h-4 text-green-600" />
                          </button>
                        ) : (
                          <>
                            <Link
                              to={`/users/${user.id}/edit`}
                              className="action-btn"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Link>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`action-btn ${user.is_active ? 'hover:bg-yellow-50' : 'hover:bg-green-50'}`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? (
                                <UserX className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-green-600" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="action-btn hover:bg-red-50 active:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Page {pagination.current_page} of {pagination.last_page}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchUsers(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
