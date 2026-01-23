import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const ConditionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    summary: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchCondition();
    }
  }, [id]);

  const fetchCondition = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.conditions}/${id}`);
      const condition = response.data.data;
      setFormData({
        name: condition.name || '',
        category: condition.category || '',
        summary: condition.summary || '',
      });
    } catch (error) {
      console.error('Error fetching condition:', error);
      alert('Failed to load condition');
      navigate('/conditions');
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
        await api.put(`${apiEndpoints.conditionsAdmin}/${id}`, formData);
      } else {
        await api.post(apiEndpoints.conditionsAdmin, formData);
      }
      navigate('/conditions');
    } catch (error) {
      console.error('Error saving condition:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save condition');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/conditions"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Condition' : 'New Condition'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing
              ? 'Update the condition details below'
              : 'Create a new medical condition'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card max-w-2xl">
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
              placeholder="e.g., Type 2 Diabetes"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="label">
              Category
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`input-field ${errors.category ? 'border-red-500' : ''}`}
              placeholder="e.g., Metabolic, Cardiovascular, Mental Health"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="label">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={5}
              className={`input-field ${errors.summary ? 'border-red-500' : ''}`}
              placeholder="A brief description of the condition..."
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-500">{errors.summary}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Condition'}
            </button>
            <Link to="/conditions" className="btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConditionForm;
