import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import { Breadcrumbs, BodySystemSelect } from '../../components/shared';

const ConditionForm = () => {
  const { t } = useTranslation(['conditions', 'common', 'knowledgeGraph']);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    summary: '',
    snomed_code: '',
    icd10_code: '',
    body_system_id: null,
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
        snomed_code: condition.snomed_code || '',
        icd10_code: condition.icd10_code || '',
        body_system_id: condition.body_system_id || null,
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

          {/* Body System */}
          <div>
            <label htmlFor="body_system_id" className="label">
              {t('knowledgeGraph:bodySystems.title')}
            </label>
            <BodySystemSelect
              value={formData.body_system_id}
              onChange={(value) => setFormData((prev) => ({ ...prev, body_system_id: value }))}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('conditions:form.bodySystemHelp')}
            </p>
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

          {/* Medical Codes Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('conditions:form.medicalCodes')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SNOMED CT Code */}
              <div>
                <label htmlFor="snomed_code" className="label">
                  {t('conditions:form.snomedCode')}
                </label>
                <input
                  type="text"
                  id="snomed_code"
                  name="snomed_code"
                  value={formData.snomed_code}
                  onChange={handleChange}
                  className={`input-field ${errors.snomed_code ? 'border-red-500' : ''}`}
                  placeholder={t('conditions:form.snomedCodePlaceholder')}
                />
                <a
                  href="https://browser.ihtsdotools.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  {t('conditions:form.lookupSnomed')}
                  <ExternalLink className="w-3 h-3" />
                </a>
                {errors.snomed_code && (
                  <p className="mt-1 text-sm text-red-500">{errors.snomed_code}</p>
                )}
              </div>

              {/* ICD-10 Code */}
              <div>
                <label htmlFor="icd10_code" className="label">
                  {t('conditions:form.icd10Code')}
                </label>
                <input
                  type="text"
                  id="icd10_code"
                  name="icd10_code"
                  value={formData.icd10_code}
                  onChange={handleChange}
                  className={`input-field ${errors.icd10_code ? 'border-red-500' : ''}`}
                  placeholder={t('conditions:form.icd10CodePlaceholder')}
                />
                <a
                  href="https://www.icd10data.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  {t('conditions:form.lookupIcd10')}
                  <ExternalLink className="w-3 h-3" />
                </a>
                {errors.icd10_code && (
                  <p className="mt-1 text-sm text-red-500">{errors.icd10_code}</p>
                )}
              </div>
            </div>
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
