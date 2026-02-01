import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import MediaUploader from '../../components/shared/MediaUploader';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const InterventionForm = () => {
  const { t } = useTranslation(['interventions', 'common', 'careDomains']);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    care_domain_id: '',
    name: '',
    description: '',
    mechanism: '',
  });
  const [media, setMedia] = useState([]);
  const [careDomains, setCareDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCareDomains();
  }, []);

  useEffect(() => {
    if (isEditing && careDomains.length > 0) {
      fetchIntervention();
    } else if (!isEditing) {
      setLoading(false);
    }
  }, [id, careDomains]);

  const fetchCareDomains = async () => {
    try {
      const response = await api.get(apiEndpoints.careDomains);
      setCareDomains(response.data.data);
    } catch (error) {
      console.error('Error fetching care domains:', error);
    }
  };

  const fetchIntervention = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.interventions}/${id}`);
      const intervention = response.data.data;
      setFormData({
        care_domain_id: intervention.care_domain_id || '',
        name: intervention.name || '',
        description: intervention.description || '',
        mechanism: intervention.mechanism || '',
      });
      setMedia(intervention.media || []);
    } catch (error) {
      console.error('Error fetching intervention:', error);
      toast.error(t('interventions:toast.loadError'));
      navigate('/interventions');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('common:validation.required', { field: t('common:labels.name') });
    }
    if (!formData.care_domain_id) {
      newErrors.care_domain_id = t('common:validation.required', { field: t('careDomains:singular') });
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
        await api.put(`${apiEndpoints.interventionsAdmin}/${id}`, formData);
      } else {
        await api.post(apiEndpoints.interventionsAdmin, formData);
      }
      navigate('/interventions');
    } catch (error) {
      console.error('Error saving intervention:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('interventions:toast.saveFailed'));
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('interventions:title'), href: '/interventions' },
          { label: isEditing ? t('interventions:form.editTitle') : t('interventions:form.createTitle') },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? t('interventions:form.editTitle') : t('interventions:form.createTitle')}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? t('interventions:form.editSubtitle')
            : t('interventions:form.newSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Care Domain */}
          <div>
            <label htmlFor="care_domain_id" className="label">
              {t('interventions:form.domain')} <span className="text-red-500">*</span>
            </label>
            <select
              id="care_domain_id"
              name="care_domain_id"
              value={formData.care_domain_id}
              onChange={handleChange}
              className={`input-field ${errors.care_domain_id ? 'border-red-500' : ''}`}
            >
              <option value="">{t('interventions:form.selectDomain')}</option>
              {careDomains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
            {errors.care_domain_id && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.care_domain_id) ? errors.care_domain_id[0] : errors.care_domain_id}
              </p>
            )}
            {careDomains.length === 0 && (
              <p className="mt-1 text-sm text-yellow-600">
                {t('careDomains:empty.noAvailable')}{' '}
                <Link to="/care-domains/new" className="underline">
                  {t('careDomains:empty.createFirst')}
                </Link>
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="label">
              {t('interventions:form.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder={t('interventions:form.namePlaceholder')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="label">
              {t('interventions:form.description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`input-field ${errors.description ? 'border-red-500' : ''}`}
              placeholder={t('interventions:form.descriptionPlaceholder')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.description) ? errors.description[0] : errors.description}
              </p>
            )}
          </div>

          {/* Mechanism */}
          <div>
            <label htmlFor="mechanism" className="label">
              {t('interventions:form.mechanism')}
            </label>
            <textarea
              id="mechanism"
              name="mechanism"
              value={formData.mechanism}
              onChange={handleChange}
              rows={4}
              className={`input-field ${errors.mechanism ? 'border-red-500' : ''}`}
              placeholder={t('interventions:form.mechanismPlaceholder')}
            />
            {errors.mechanism && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.mechanism) ? errors.mechanism[0] : errors.mechanism}
              </p>
            )}
          </div>

          {/* Media - Only show when editing */}
          {isEditing && (
            <div className="pt-6 border-t border-gray-200">
              <label className="label flex items-center gap-2">
                <Image className="w-4 h-4" />
                {t('common:labels.media')}
              </label>
              <p className="text-sm text-gray-500 mb-4">
                {t('interventions:form.mediaDescription')}
              </p>
              <MediaUploader
                interventionId={id}
                media={media}
                onMediaChange={setMedia}
              />
            </div>
          )}

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
              {saving ? t('common:buttons.saving') : t('common:buttons.save')}
            </button>
            <Link to="/interventions" className="btn-outline">
              {t('common:buttons.cancel')}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InterventionForm;
