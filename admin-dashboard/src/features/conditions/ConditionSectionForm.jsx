import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints, getApiBaseUrl } from '../../lib/api';
import { toast } from '../../lib/swal';
import RichTextEditor from '../../components/editor/RichTextEditor';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const ConditionSectionForm = () => {
  const { t } = useTranslation(['conditions', 'common']);
  const { id: conditionId, sectionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(sectionId);

  const SECTION_TYPES = [
    { value: 'risk_factors', labelKey: 'conditions:sections.types.riskFactors' },
    { value: 'physiology', labelKey: 'conditions:sections.types.physiology' },
    { value: 'complications', labelKey: 'conditions:sections.types.complications' },
    { value: 'solutions', labelKey: 'conditions:sections.types.solutions' },
    { value: 'additional_factors', labelKey: 'conditions:sections.types.additionalFactors' },
    { value: 'scripture', labelKey: 'conditions:sections.types.scripture' },
    { value: 'research_ideas', labelKey: 'conditions:sections.types.researchIdeas' },
  ];

  // Get pre-selected type from URL query parameter
  const preSelectedType = searchParams.get('type') || '';

  const [condition, setCondition] = useState(null);
  const [formData, setFormData] = useState({
    condition_id: conditionId,
    section_type: preSelectedType,
    title: preSelectedType ? t(SECTION_TYPES.find(st => st.value === preSelectedType)?.labelKey || '') : '',
    body: '',
    order_index: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCondition();
    if (isEditing) {
      fetchSection();
    } else {
      setLoading(false);
    }
  }, [conditionId, sectionId]);

  const fetchCondition = async () => {
    try {
      const response = await api.get(`${apiEndpoints.conditions}/${conditionId}`);
      setCondition(response.data.data);
    } catch (error) {
      console.error('Error fetching condition:', error);
    }
  };

  const fetchSection = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.conditionSectionsAdmin}/${sectionId}`);
      const section = response.data.data;
      setFormData({
        condition_id: conditionId,
        section_type: section.section_type || '',
        title: section.title || '',
        body: section.body || '',
        order_index: section.order_index || 0,
      });
    } catch (error) {
      console.error('Error fetching section:', error);
      toast.error(t('conditions:sections.toast.loadFailed'));
      navigate(`/conditions/${conditionId}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload for the rich text editor
  const handleImageUpload = useCallback(async (file) => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'image');
      formDataUpload.append('alt_text', file.name);

      const response = await api.post(
        apiEndpoints.conditionMediaAdmin(conditionId),
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Return the full URL of the uploaded image
      const mediaData = response.data.data;
      return mediaData.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('common:media.uploadError'));
      return null;
    }
  }, [conditionId]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.section_type) {
      newErrors.section_type = t('common:validation.required', { field: t('conditions:sections.form.sectionType') });
    }
    if (!formData.title.trim()) {
      newErrors.title = t('common:validation.required', { field: t('common:labels.title') });
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
        await api.put(`${apiEndpoints.conditionSectionsAdmin}/${sectionId}`, formData);
      } else {
        await api.post(apiEndpoints.conditionSectionsAdmin, formData);
      }
      navigate(`/conditions/${conditionId}`);
    } catch (error) {
      console.error('Error saving section:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(t('conditions:sections.toast.saveFailed'));
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
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('conditions:title'), href: '/conditions' },
          { label: condition?.name || t('conditions:singular'), href: `/conditions/${conditionId}` },
          { label: isEditing ? t('conditions:sections.form.editTitle') : t('conditions:sections.form.newTitle') },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? t('conditions:sections.form.editTitle') : t('conditions:sections.form.newTitle')}
        </h1>
        {condition && (
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t('conditions:sections.form.forCondition')}: <span className="font-medium">{condition.name}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto">
        <div className="space-y-5 sm:space-y-6">
          {/* Section Type */}
          <div>
            <label htmlFor="section_type" className="label">
              {t('conditions:sections.form.sectionType')} <span className="text-red-500">*</span>
            </label>
            <select
              id="section_type"
              name="section_type"
              value={formData.section_type}
              onChange={handleChange}
              className={`input-field ${errors.section_type ? 'border-red-500' : ''}`}
            >
              <option value="">{t('conditions:sections.form.selectSectionType')}</option>
              {SECTION_TYPES.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
            {errors.section_type && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.section_type) ? errors.section_type[0] : errors.section_type}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              {t('common:labels.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
              placeholder={t('conditions:sections.form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.title) ? errors.title[0] : errors.title}
              </p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="label">{t('common:labels.content')}</label>
            <RichTextEditor
              content={formData.body}
              onChange={(html) =>
                setFormData((prev) => ({ ...prev, body: html }))
              }
              placeholder={t('conditions:sections.form.contentPlaceholder')}
              onImageUpload={handleImageUpload}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('conditions:sections.form.imageHint')}
            </p>
          </div>

          {/* Order Index */}
          <div>
            <label htmlFor="order_index" className="label">
              {t('common:labels.displayOrder')}
            </label>
            <input
              type="number"
              id="order_index"
              name="order_index"
              value={formData.order_index}
              onChange={handleChange}
              className="input-field w-full sm:w-32"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('conditions:sections.form.orderHint')}
            </p>
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
            <Link to={`/conditions/${conditionId}`} className="btn-outline text-center w-full sm:w-auto">
              {t('common:buttons.cancel')}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConditionSectionForm;
