import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const ConditionForm = () => {
  const { t } = useTranslation(['conditions', 'common']);
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
      toast.error(t('conditions:toast.loadFailed'));
      navigate('/conditions');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('common:validation.required', { field: t('conditions:form.name') });
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
        toast.error(t('conditions:toast.saveFailed'));
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
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('conditions:title'), href: '/conditions' },
          { label: isEditing ? t('conditions:form.editTitle') : t('conditions:form.newTitle') },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? t('conditions:form.editTitle') : t('conditions:form.newTitle')}
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          {isEditing
            ? t('conditions:form.editSubtitle')
            : t('conditions:form.newSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-5 sm:space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="label">
              {t('conditions:form.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder={t('conditions:form.namePlaceholder')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="label">
              {t('conditions:form.category')}
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`input-field ${errors.category ? 'border-red-500' : ''}`}
              placeholder={t('conditions:form.categoryPlaceholder')}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="label">
              {t('conditions:form.summary')}
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={5}
              className={`input-field resize-y ${errors.summary ? 'border-red-500' : ''}`}
              placeholder={t('conditions:form.summaryPlaceholder')}
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-500">{errors.summary}</p>
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
              {saving ? t('common:buttons.saving') : t('common:buttons.save')}
            </button>
            <Link to="/conditions" className="btn-outline text-center w-full sm:w-auto">
              {t('common:buttons.cancel')}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConditionForm;
