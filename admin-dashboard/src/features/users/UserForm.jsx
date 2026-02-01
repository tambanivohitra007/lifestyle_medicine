import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save, Shield, PenTool, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const UserForm = () => {
  const { t } = useTranslation(['users', 'common']);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'viewer',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
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
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('common:validation.required', { field: t('common:labels.name') });
    }

    if (!formData.email.trim()) {
      newErrors.email = t('common:validation.required', { field: t('common:labels.email') });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('common:messages.error.invalidEmail');
    }

    if (!isEditing && !formData.password) {
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

    if (!validate()) return;

    try {
      setSaving(true);
      setErrors({});

      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (isEditing) {
        await api.put(`${apiEndpoints.users}/${id}`, payload);
        toast.success(t('users:toast.updated'));
      } else {
        await api.post(apiEndpoints.users, payload);
        toast.success(t('users:toast.created'));
      }

      navigate('/users');
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

  const breadcrumbItems = [
    { label: t('users:title'), path: '/users' },
    { label: isEditing ? t('users:form.editTitle') : t('users:form.createTitle') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? t('users:form.editTitle') : t('users:form.createTitle')}
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          {isEditing ? t('users:form.editSubtitle') : t('users:form.createSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('users:form.password')} {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                placeholder={isEditing ? t('users:form.passwordKeepCurrent') : t('users:form.passwordPlaceholder')}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
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
                <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common:buttons.saving')}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditing ? t('users:form.updateUser') : t('users:form.createUser')}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="btn-secondary order-2 sm:order-1"
          >
            {t('common:buttons.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
