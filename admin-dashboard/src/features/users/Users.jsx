import { useEffect, useState } from 'react';
import { Plus, Search, Users as UsersIcon, Edit, Trash2, RotateCcw, UserCheck, UserX, Shield, PenTool, Eye, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Swal from 'sweetalert2';
import SlideOver from '../../components/shared/SlideOver';

const Users = () => {
  const { t } = useTranslation(['users', 'common']);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'viewer',
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
      toast.error(t('users:toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = await confirmDelete(user.name);
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.users}/${user.id}`);
      toast.success(t('users:toast.deleted'));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('users:toast.deleteError'));
      }
    }
  };

  const handleToggleActive = async (user) => {
    const isDeactivating = user.is_active;
    const result = await Swal.fire({
      title: isDeactivating ? t('users:actions.deactivateTitle') : t('users:actions.activateTitle'),
      text: isDeactivating
        ? t('users:actions.deactivateConfirm', { name: user.name })
        : t('users:actions.activateConfirm', { name: user.name }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isDeactivating ? '#dc2626' : '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: isDeactivating ? t('users:actions.yesDeactivate') : t('users:actions.yesActivate'),
      cancelButtonText: t('common:buttons.cancel'),
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(apiEndpoints.userToggleActive(user.id));
      toast.success(isDeactivating ? t('users:toast.deactivated') : t('users:toast.activated'));
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(isDeactivating ? t('users:toast.deactivateError') : t('users:toast.activateError'));
      }
    }
  };

  const handleRestore = async (user) => {
    const result = await Swal.fire({
      title: t('users:actions.restoreTitle'),
      text: t('users:actions.restoreConfirm', { name: user.name }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('users:actions.yesRestore'),
      cancelButtonText: t('common:buttons.cancel'),
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(apiEndpoints.userRestore(user.id));
      toast.success(t('users:toast.restored'));
      fetchUsers();
    } catch (error) {
      console.error('Error restoring user:', error);
      toast.error(t('users:toast.restoreError'));
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { icon: Shield, class: 'bg-purple-100 text-purple-700', labelKey: 'users:roles.admin' },
      editor: { icon: PenTool, class: 'bg-blue-100 text-blue-700', labelKey: 'users:roles.editor' },
      viewer: { icon: Eye, class: 'bg-gray-100 text-gray-700', labelKey: 'users:roles.viewer' },
    };
    const badge = badges[role] || badges.viewer;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {t(badge.labelKey)}
      </span>
    );
  };

  const getStatusBadge = (isActive, isDeleted) => {
    if (isDeleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <Trash2 className="w-3 h-3" />
          {t('users:status.deleted')}
        </span>
      );
    }
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <UserCheck className="w-3 h-3" />
        {t('users:status.active')}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <UserX className="w-3 h-3" />
        {t('users:status.inactive')}
      </span>
    );
  };

  // Modal functions
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'viewer',
      is_active: true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setEditingId(id);
    setErrors({});
    setIsModalOpen(true);
    setFormLoading(true);

    try {
      const response = await api.get(`${apiEndpoints.users}/${id}`);
      const user = response.data.data;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        role: user.role || 'viewer',
        is_active: user.is_active ?? true,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error(t('users:toast.loadError'));
      setIsModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'viewer',
      is_active: true,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('common:validation.required', { field: t('common:labels.name') });
    }

    if (!formData.email.trim()) {
      newErrors.email = t('common:validation.required', { field: t('common:labels.email') });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('common:messages.error.invalidEmail');
    }

    if (!editingId && !formData.password) {
      newErrors.password = t('common:validation.required', { field: t('users:form.password') });
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = t('users:validation.passwordMinLength');
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = t('users:validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await api.put(`${apiEndpoints.users}/${editingId}`, payload);
        toast.success(t('users:toast.updated'));
      } else {
        await api.post(apiEndpoints.users, payload);
        toast.success(t('users:toast.created'));
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('users:toast.updateError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const filteredUsers = users;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('users:list.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t('users:list.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          {t('users:list.addNew')}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('users:list.searchPlaceholder')}
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
            <option value="">{t('users:list.allRoles')}</option>
            <option value="admin">{t('users:roles.admin')}</option>
            <option value="editor">{t('users:roles.editor')}</option>
            <option value="viewer">{t('users:roles.viewer')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{t('users:list.allStatuses')}</option>
            <option value="1">{t('users:status.active')}</option>
            <option value="0">{t('users:status.inactive')}</option>
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
            {searchTerm || roleFilter || statusFilter ? t('users:empty.title') : t('users:empty.noUsersYet')}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            {searchTerm || roleFilter || statusFilter
              ? t('users:empty.adjustFilters')
              : t('users:empty.description')}
          </p>
          {!searchTerm && !roleFilter && !statusFilter && (
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('users:empty.action')}
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users:singular')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    {t('users:form.role')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    {t('common:labels.status')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    {t('common:labels.createdAt')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common:labels.actions')}
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
                            title={t('users:actions.restore')}
                          >
                            <RotateCcw className="w-4 h-4 text-green-600" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(user.id)}
                              className="action-btn"
                              title={t('common:buttons.edit')}
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`action-btn ${user.is_active ? 'hover:bg-yellow-50' : 'hover:bg-green-50'}`}
                              title={user.is_active ? t('users:actions.deactivate') : t('users:actions.activate')}
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
                              title={t('common:buttons.delete')}
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
                {t('common:pagination.page')} {pagination.current_page} {t('common:pagination.of')} {pagination.last_page}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {t('common:pagination.previous')}
                </button>
                <button
                  onClick={() => fetchUsers(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {t('common:pagination.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SlideOver Modal for Create/Edit */}
      <SlideOver
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? t('users:form.editTitle') : t('users:form.createTitle')}
        subtitle={editingId ? t('users:form.editSubtitle') : t('users:form.createSubtitle')}
        size="lg"
      >
        {formLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">
                {t('users:form.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder={t('users:form.namePlaceholder')}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                {t('users:form.email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder={t('users:form.emailPlaceholder')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="label">
                  {t('users:form.password')} {!editingId && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                  placeholder={editingId ? t('users:form.passwordKeepCurrent') : t('users:form.passwordPlaceholder')}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password_confirmation" className="label">
                  {t('users:form.confirmPassword')}
                </label>
                <input
                  type="password"
                  id="password_confirmation"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className={`input-field ${errors.password_confirmation ? 'border-red-500' : ''}`}
                  placeholder={t('users:form.confirmPasswordPlaceholder')}
                />
                {errors.password_confirmation && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.password_confirmation) ? errors.password_confirmation[0] : errors.password_confirmation}
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="label">
                {t('users:form.role')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'admin', labelKey: 'users:roles.admin', icon: Shield, descKey: 'users:roleDescriptions.admin', color: 'purple' },
                  { value: 'editor', labelKey: 'users:roles.editor', icon: PenTool, descKey: 'users:roleDescriptions.editor', color: 'blue' },
                  { value: 'viewer', labelKey: 'users:roles.viewer', icon: Eye, descKey: 'users:roleDescriptions.viewer', color: 'gray' },
                ].map((role) => (
                  <label
                    key={role.value}
                    className={`
                      relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${formData.role === role.value
                        ? `border-${role.color}-500 bg-${role.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <role.icon className={`w-5 h-5 mt-0.5 ${
                      formData.role === role.value ? `text-${role.color}-600` : 'text-gray-400'
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        formData.role === role.value ? `text-${role.color}-900` : 'text-gray-900'
                      }`}>
                        {t(role.labelKey)}
                      </p>
                      <p className="text-sm text-gray-500">{t(role.descKey)}</p>
                    </div>
                    {formData.role === role.value && (
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${role.color}-500`} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">{t('users:form.activeAccount')}</span>
                  <p className="text-sm text-gray-500">{t('users:form.activeAccountDescription')}</p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? t('common:buttons.saving') : editingId ? t('users:form.updateUser') : t('users:form.createUser')}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="btn-outline w-full sm:w-auto"
              >
                {t('common:buttons.cancel')}
              </button>
            </div>
          </form>
        )}
      </SlideOver>
    </div>
  );
};

export default Users;
