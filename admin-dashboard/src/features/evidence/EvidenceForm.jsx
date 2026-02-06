import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const STUDY_TYPES = [
  { value: 'meta_analysis', labelKey: 'meta_analysis_full', tier: 1 },
  { value: 'systematic_review', labelKey: 'systematic_review_full', tier: 1 },
  { value: 'rct', labelKey: 'rct_full', tier: 2 },
  { value: 'cohort', labelKey: 'cohort_full', tier: 3 },
  { value: 'case_control', labelKey: 'case_control_full', tier: 3 },
  { value: 'cross_sectional', labelKey: 'cross_sectional_full', tier: 3 },
  { value: 'observational', labelKey: 'observational_full', tier: 3 },
  { value: 'case_series', labelKey: 'case_series_full', tier: 4 },
  { value: 'case_report', labelKey: 'case_report_full', tier: 4 },
  { value: 'expert_opinion', labelKey: 'expert_opinion_full', tier: 5 },
];

const QUALITY_RATINGS = [
  { value: 'A', labelKey: 'A_full' },
  { value: 'B', labelKey: 'B_full' },
  { value: 'C', labelKey: 'C_full' },
  { value: 'D', labelKey: 'D_full' },
];

const RECOMMENDATION_STRENGTHS = [
  { value: 'strong', labelKey: 'strong', descKey: 'strongDescription' },
  { value: 'weak', labelKey: 'weak', descKey: 'weakDescription' },
];

const EvidenceForm = () => {
  const { t } = useTranslation(['evidence', 'common']);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    intervention_id: '',
    study_type: '',
    population: '',
    sample_size: '',
    quality_rating: '',
    recommendation_strength: '',
    summary: '',
    notes: '',
  });
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInterventions();
  }, []);

  useEffect(() => {
    if (isEditing && interventions.length > 0) {
      fetchEvidence();
    } else if (!isEditing) {
      setLoading(false);
    }
  }, [id, interventions]);

  const fetchInterventions = async () => {
    try {
      const response = await api.get(apiEndpoints.interventions);
      setInterventions(response.data.data);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    }
  };

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.evidenceEntries}/${id}`);
      const evidence = response.data.data;
      setFormData({
        intervention_id: evidence.intervention_id || '',
        study_type: evidence.study_type || '',
        population: evidence.population || '',
        sample_size: evidence.sample_size || '',
        quality_rating: evidence.quality_rating || '',
        recommendation_strength: evidence.recommendation_strength || '',
        summary: evidence.summary || '',
        notes: evidence.notes || '',
      });
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast.error('Failed to load evidence');
      navigate('/evidence');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.intervention_id) {
      newErrors.intervention_id = 'Intervention is required';
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
        await api.put(`${apiEndpoints.evidenceEntriesAdmin}/${id}`, formData);
      } else {
        await api.post(apiEndpoints.evidenceEntriesAdmin, formData);
      }
      navigate('/evidence');
    } catch (error) {
      console.error('Error saving evidence:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Failed to save evidence');
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
          { label: 'Evidence', href: '/evidence' },
          { label: isEditing ? 'Edit Evidence' : 'New Evidence' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Evidence' : 'New Evidence Entry'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update the evidence details' : 'Add new evidence for an intervention'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Intervention */}
          <div>
            <label htmlFor="intervention_id" className="label">
              Intervention <span className="text-red-500">*</span>
            </label>
            <select
              id="intervention_id"
              name="intervention_id"
              value={formData.intervention_id}
              onChange={handleChange}
              className={`input-field ${errors.intervention_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select an intervention</option>
              {interventions.map((intervention) => (
                <option key={intervention.id} value={intervention.id}>
                  {intervention.name}
                  {intervention.care_domain && ` (${intervention.care_domain.name})`}
                </option>
              ))}
            </select>
            {errors.intervention_id && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.intervention_id) ? errors.intervention_id[0] : errors.intervention_id}
              </p>
            )}
          </div>

          {/* Study Type */}
          <div>
            <label htmlFor="study_type" className="label">
              {t('evidence:form.studyType')}
            </label>
            <select
              id="study_type"
              name="study_type"
              value={formData.study_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">{t('evidence:form.selectStudyType')}</option>
              {STUDY_TYPES.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(`evidence:studyTypes.${labelKey}`)}
                </option>
              ))}
            </select>
          </div>

          {/* GRADE Assessment */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700">{t('evidence:grade.title')}</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quality_rating" className="label">
                  {t('evidence:form.qualityRating')}
                </label>
                <select
                  id="quality_rating"
                  name="quality_rating"
                  value={formData.quality_rating}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">{t('evidence:form.selectQualityRating')}</option>
                  {QUALITY_RATINGS.map(({ value, labelKey }) => (
                    <option key={value} value={value}>
                      {t(`evidence:quality.${labelKey}`)}
                    </option>
                  ))}
                </select>
                {formData.quality_rating && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t(`evidence:grade.qualityDescription.${formData.quality_rating}`)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="recommendation_strength" className="label">
                  {t('evidence:recommendation.title')}
                </label>
                <select
                  id="recommendation_strength"
                  name="recommendation_strength"
                  value={formData.recommendation_strength}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">-</option>
                  {RECOMMENDATION_STRENGTHS.map(({ value, labelKey }) => (
                    <option key={value} value={value}>
                      {t(`evidence:recommendation.${labelKey}`)}
                    </option>
                  ))}
                </select>
                {formData.recommendation_strength && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t(`evidence:recommendation.${formData.recommendation_strength}Description`)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Population & Sample Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="population" className="label">
                {t('evidence:form.population')}
              </label>
              <input
                type="text"
                id="population"
                name="population"
                value={formData.population}
                onChange={handleChange}
                className="input-field"
                placeholder={t('evidence:form.populationPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="sample_size" className="label">
                {t('evidence:form.sampleSize')}
              </label>
              <input
                type="number"
                id="sample_size"
                name="sample_size"
                value={formData.sample_size}
                onChange={handleChange}
                className="input-field"
                placeholder={t('evidence:form.sampleSizePlaceholder')}
                min="1"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="label">
              {t('evidence:form.summary')}
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder={t('evidence:form.summaryPlaceholder')}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">
              {t('evidence:form.notes')}
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder={t('evidence:form.notesPlaceholder')}
            />
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
              {saving ? t('common:buttons.saving') : t('evidence:form.saveEvidence')}
            </button>
            <Link to="/evidence" className="btn-outline">
              {t('common:buttons.cancel')}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EvidenceForm;
