import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const CareDomainForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchCareDomain();
    }
  }, [id]);

  const fetchCareDomain = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.careDomains}/${id}`);
      const domain = response.data.data;
      setFormData({
        name: domain.name || '',
      });
    } catch (error) {
      console.error('Error fetching care domain:', error);
      toast.error('Failed to load care domain');
      navigate('/care-domains');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (isEditing) {
        await api.put(`${apiEndpoints.careDomainsAdmin}/${id}`, formData);
      } else {
        await api.post(apiEndpoints.careDomainsAdmin, formData);
      }
      navigate('/care-domains');
    } catch (error) {
      console.error('Error saving care domain:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save care domain');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Care Domains', href: '/care-domains' },
          { label: isEditing ? 'Edit Care Domain' : 'New Care Domain' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Care Domain' : 'New Care Domain'}
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          {isEditing
            ? 'Update the care domain details below'
            : 'Create a new care domain to categorize interventions'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="label">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., Nutrition, Exercise, Hydrotherapy"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4 pt-4 border-t border-gray-200">
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
              {saving ? 'Saving...' : 'Save Care Domain'}
            </button>
            <Link to="/care-domains" className="btn-outline text-center w-full sm:w-auto">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CareDomainForm;
