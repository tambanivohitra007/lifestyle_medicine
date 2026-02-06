import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  X,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  BookOpen,
} from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';

const QUALITY_GRADES = ['A', 'B', 'C', 'D'];
const GRADE_COLORS = {
  A: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  D: 'bg-red-100 text-red-700 border-red-200',
};

const STRENGTH_COLORS = {
  strong: 'bg-emerald-100 text-emerald-700',
  weak: 'bg-amber-100 text-amber-700',
};

const EvidenceSummaryEditor = ({
  conditionId,
  interventionId,
  conditions = [],
  interventions = [],
  mode = 'condition', // 'condition' | 'intervention' | 'pair'
}) => {
  const { t } = useTranslation(['evidence', 'common', 'conditions', 'interventions']);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    condition_id: conditionId || '',
    intervention_id: interventionId || '',
    summary: '',
    key_findings: '',
    overall_quality: 'B',
    recommendation_strength: 'weak',
    last_reviewed: '',
    next_review_due: '',
    reviewer_notes: '',
    total_studies: '',
    total_participants: '',
  });

  useEffect(() => {
    fetchSummaries();
  }, [conditionId, interventionId]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      let response;

      if (mode === 'pair' && conditionId && interventionId) {
        response = await api.get(
          apiEndpoints.conditionInterventionEvidenceSummary(conditionId, interventionId)
        );
        setSummaries(response.data.data ? [response.data.data] : []);
      } else if (mode === 'condition' && conditionId) {
        response = await api.get(apiEndpoints.conditionEvidenceSummaries(conditionId));
        setSummaries(response.data.data || []);
      } else if (mode === 'intervention' && interventionId) {
        response = await api.get(apiEndpoints.interventionEvidenceSummaries(interventionId));
        setSummaries(response.data.data || []);
      } else {
        response = await api.get(apiEndpoints.evidenceSummaries);
        setSummaries(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching evidence summaries:', error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      condition_id: conditionId || '',
      intervention_id: interventionId || '',
      summary: '',
      key_findings: '',
      overall_quality: 'B',
      recommendation_strength: 'weak',
      last_reviewed: '',
      next_review_due: '',
      reviewer_notes: '',
      total_studies: '',
      total_participants: '',
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setFormData({
      condition_id: item.condition_id,
      intervention_id: item.intervention_id,
      summary: item.summary || '',
      key_findings: item.key_findings || '',
      overall_quality: item.overall_quality || 'B',
      recommendation_strength: item.recommendation_strength || 'weak',
      last_reviewed: item.last_reviewed || '',
      next_review_due: item.next_review_due || '',
      reviewer_notes: item.reviewer_notes || '',
      total_studies: item.total_studies || '',
      total_participants: item.total_participants || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.summary.trim()) {
      toast.error(t('common:validation.required', { field: t('evidence:summary.summaryText') }));
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData };

      // Clean up empty values
      if (!payload.total_studies) delete payload.total_studies;
      if (!payload.total_participants) delete payload.total_participants;
      if (!payload.last_reviewed) delete payload.last_reviewed;
      if (!payload.next_review_due) delete payload.next_review_due;

      if (editingItem) {
        await api.put(apiEndpoints.evidenceSummaryAdmin(editingItem.id), payload);
        toast.success(t('evidence:summary.toast.updated'));
      } else {
        await api.post(apiEndpoints.evidenceSummariesAdmin, payload);
        toast.success(t('evidence:summary.toast.created'));
      }
      resetForm();
      fetchSummaries();
    } catch (error) {
      console.error('Error saving evidence summary:', error);
      toast.error(t('evidence:summary.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmDelete(t('evidence:summary.title'));
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.evidenceSummaryAdmin(item.id));
      toast.success(t('evidence:summary.toast.deleted'));
      fetchSummaries();
    } catch (error) {
      console.error('Error deleting evidence summary:', error);
      toast.error(t('evidence:summary.toast.deleteError'));
    }
  };

  const handleMarkReviewed = async (item) => {
    try {
      await api.post(apiEndpoints.markEvidenceSummaryReviewed(item.id), {});
      toast.success(t('evidence:summary.toast.reviewed'));
      fetchSummaries();
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('evidence:summary.title')}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('evidence:summary.addNew')}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              {editingItem ? t('evidence:summary.edit') : t('evidence:summary.addNew')}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Condition/Intervention Selection (if not in pair mode) */}
          {mode !== 'pair' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode !== 'condition' && (
                <div>
                  <label htmlFor="condition_id" className="label">
                    {t('conditions:singular')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="condition_id"
                    name="condition_id"
                    value={formData.condition_id}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={!!conditionId}
                  >
                    <option value="">-</option>
                    {conditions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {mode !== 'intervention' && (
                <div>
                  <label htmlFor="intervention_id" className="label">
                    {t('interventions:singular')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="intervention_id"
                    name="intervention_id"
                    value={formData.intervention_id}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={!!interventionId}
                  >
                    <option value="">-</option>
                    {interventions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* GRADE Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="overall_quality" className="label">
                {t('evidence:summary.overallQuality')} <span className="text-red-500">*</span>
              </label>
              <select
                id="overall_quality"
                name="overall_quality"
                value={formData.overall_quality}
                onChange={handleChange}
                className="input-field"
                required
              >
                {QUALITY_GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade} - {t(`evidence:grade.quality.${grade}`)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t(`evidence:grade.qualityDescription.${formData.overall_quality}`)}
              </p>
            </div>
            <div>
              <label htmlFor="recommendation_strength" className="label">
                {t('evidence:summary.recommendationStrength')} <span className="text-red-500">*</span>
              </label>
              <select
                id="recommendation_strength"
                name="recommendation_strength"
                value={formData.recommendation_strength}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="strong">{t('evidence:grade.recommendation.strong')}</option>
                <option value="weak">{t('evidence:grade.recommendation.weak')}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t(`evidence:grade.recommendationDescription.${formData.recommendation_strength}`)}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="label">
              {t('evidence:summary.summaryText')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder={t('evidence:summary.summaryTextPlaceholder')}
              required
            />
          </div>

          {/* Key Findings */}
          <div>
            <label htmlFor="key_findings" className="label">
              {t('evidence:summary.keyFindings')}
            </label>
            <textarea
              id="key_findings"
              name="key_findings"
              value={formData.key_findings}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder={t('evidence:summary.keyFindingsPlaceholder')}
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="total_studies" className="label">
                {t('evidence:summary.totalStudies')}
              </label>
              <input
                type="number"
                id="total_studies"
                name="total_studies"
                value={formData.total_studies}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="total_participants" className="label">
                {t('evidence:summary.totalParticipants')}
              </label>
              <input
                type="number"
                id="total_participants"
                name="total_participants"
                value={formData.total_participants}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="last_reviewed" className="label">
                {t('evidence:summary.lastReviewed')}
              </label>
              <input
                type="date"
                id="last_reviewed"
                name="last_reviewed"
                value={formData.last_reviewed}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="next_review_due" className="label">
                {t('evidence:summary.nextReviewDue')}
              </label>
              <input
                type="date"
                id="next_review_due"
                name="next_review_due"
                value={formData.next_review_due}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Reviewer Notes */}
          <div>
            <label htmlFor="reviewer_notes" className="label">
              {t('evidence:summary.reviewerNotes')}
            </label>
            <textarea
              id="reviewer_notes"
              name="reviewer_notes"
              value={formData.reviewer_notes}
              onChange={handleChange}
              rows={2}
              className="input-field"
              placeholder={t('evidence:summary.reviewerNotesPlaceholder')}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? t('common:buttons.saving') : t('common:buttons.save')}
            </button>
            <button type="button" onClick={resetForm} className="btn-outline">
              {t('common:buttons.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Summaries List */}
      {summaries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('evidence:summary.noSummaries')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map((item) => (
            <div
              key={item.id}
              className={`card border ${GRADE_COLORS[item.overall_quality]?.split(' ')[2] || 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${GRADE_COLORS[item.overall_quality]}`}>
                    {t('evidence:grade.quality.title', { defaultValue: 'Grade' })} {item.overall_quality}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${STRENGTH_COLORS[item.recommendation_strength]}`}>
                    {t(`evidence:grade.recommendation.${item.recommendation_strength}`)}
                  </span>
                  {item.needs_review ? (
                    <span className="px-2 py-1 rounded text-sm bg-orange-100 text-orange-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t('evidence:summary.needsReview')}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {t('evidence:summary.upToDate')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {item.needs_review && (
                    <button
                      onClick={() => handleMarkReviewed(item)}
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title={t('evidence:summary.markReviewed')}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Linked Condition/Intervention (if showing all) */}
              {mode === 'condition' && item.intervention && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{t('interventions:singular')}:</span> {item.intervention.name}
                </p>
              )}
              {mode === 'intervention' && item.condition && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{t('conditions:singular')}:</span> {item.condition.name}
                </p>
              )}

              {/* Summary */}
              <p className="text-gray-700 whitespace-pre-wrap mb-3">{item.summary}</p>

              {/* Key Findings */}
              {item.key_findings && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">{t('evidence:summary.keyFindings')}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.key_findings}</p>
                </div>
              )}

              {/* Statistics */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                {item.total_studies > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {item.total_studies} {t('evidence:summary.totalStudies').toLowerCase()}
                  </span>
                )}
                {item.total_participants > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {item.total_participants.toLocaleString()} {t('evidence:summary.totalParticipants').toLowerCase()}
                  </span>
                )}
                {item.last_reviewed && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {t('evidence:summary.lastReviewed')}: {item.last_reviewed}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceSummaryEditor;
