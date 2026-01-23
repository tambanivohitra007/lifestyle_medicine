import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, Shield, PenTool, Eye } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast } from '../lib/swal';
import Breadcrumbs from '../components/Breadcrumbs';

const UserForm = () => {
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
      toast.error('Failed to load user');
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
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
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
        toast.success('User updated');
      } else {
        await api.post(apiEndpoints.users, payload);
        toast.success('User created');
      }

      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save user');
      }
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Users', path: '/users' },
    { label: isEditing ? 'Edit User' : 'New User' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit User' : 'New User'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {isEditing ? 'Update user information and permissions' : 'Create a new user account'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`input-field ${errors.password_confirmation ? 'border-red-500' : ''}`}
                placeholder="Confirm password"
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'admin', label: 'Admin', icon: Shield, description: 'Full access to all features', color: 'purple' },
                { value: 'editor', label: 'Editor', icon: PenTool, description: 'Can create and edit content', color: 'blue' },
                { value: 'viewer', label: 'Viewer', icon: Eye, description: 'Read-only access', color: 'gray' },
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
                      {role.label}
                    </p>
                    <p className="text-sm text-gray-500">{role.description}</p>
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
                <span className="font-medium text-gray-900">Active Account</span>
                <p className="text-sm text-gray-500">Inactive users cannot log in</p>
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
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditing ? 'Update User' : 'Create User'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="btn-secondary order-2 sm:order-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
