import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  BarChart3,
  X,
  Save,
  Loader2,
  Star,
  AlertCircle,
} from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';

const EFFECTIVENESS_RATINGS = ['very_high', 'high', 'moderate', 'low', 'uncertain'];
const EVIDENCE_GRADES = ['A', 'B', 'C', 'D'];

const RATING_COLORS = {
  very_high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  high: 'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-orange-100 text-orange-700 border-orange-200',
  uncertain: 'bg-gray-100 text-gray-600 border-gray-200',
};

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100 text-red-700',
};

const EffectivenessRatingEditor = ({
  conditionId,
  interventionId,
  conditions = [],
  interventions = [],
  mode = 'condition', // 'condition' | 'intervention'
}) => {
  const { t } = useTranslation(['knowledgeGraph', 'common', 'conditions', 'interventions', 'evidence']);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    condition_id: conditionId || '',
    intervention_id: interventionId || '',
    effectiveness_rating: 'moderate',
    evidence_grade: '',
    is_primary: false,
    notes: '',
  });

  useEffect(() => {
    fetchRatings();
  }, [conditionId, interventionId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      let response;

      if (mode === 'condition' && conditionId) {
        response = await api.get(apiEndpoints.conditionEffectiveness(conditionId));
      } else if (mode === 'intervention' && interventionId) {
        response = await api.get(apiEndpoints.interventionEffectiveness(interventionId));
      } else {
        response = await api.get(apiEndpoints.effectiveness);
      }
      setRatings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching effectiveness ratings:', error);
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      condition_id: conditionId || '',
      intervention_id: interventionId || '',
      effectiveness_rating: 'moderate',
      evidence_grade: '',
      is_primary: false,
      notes: '',
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = (item) => {
    setFormData({
      condition_id: item.condition_id,
      intervention_id: item.intervention_id,
      effectiveness_rating: item.effectiveness_rating || 'moderate',
      evidence_grade: item.evidence_grade || '',
      is_primary: item.is_primary || false,
      notes: item.notes || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.condition_id || !formData.intervention_id) {
      toast.error(t('common:validation.required', { field: t('knowledgeGraph:effectiveness.selectCondition') }));
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData };

      // Clean up empty values
      if (!payload.evidence_grade) delete payload.evidence_grade;
      if (!payload.notes) delete payload.notes;

      if (editingItem) {
        await api.put(apiEndpoints.effectivenessAdminItem(editingItem.id), payload);
        toast.success(t('common:toast.updated'));
      } else {
        await api.post(apiEndpoints.effectivenessAdmin, payload);
        toast.success(t('common:toast.created'));
      }
      resetForm();
      fetchRatings();
    } catch (error) {
      console.error('Error saving effectiveness rating:', error);
      toast.error(t('common:toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmDelete(t('knowledgeGraph:effectiveness.rating'));
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.effectivenessAdminItem(item.id));
      toast.success(t('common:toast.deleted'));
      fetchRatings();
    } catch (error) {
      console.error('Error deleting effectiveness rating:', error);
      toast.error(t('common:toast.deleteError'));
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
          {t('knowledgeGraph:effectiveness.title')}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('knowledgeGraph:effectiveness.addRating')}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              {editingItem ? t('knowledgeGraph:effectiveness.editRating') : t('knowledgeGraph:effectiveness.addRating')}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Condition/Intervention Selection */}
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
                  disabled={!!conditionId || !!editingItem}
                >
                  <option value="">{t('knowledgeGraph:effectiveness.selectCondition')}</option>
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
                  disabled={!!interventionId || !!editingItem}
                >
                  <option value="">{t('knowledgeGraph:effectiveness.selectIntervention')}</option>
                  {interventions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Rating and Evidence Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="effectiveness_rating" className="label">
                {t('knowledgeGraph:effectiveness.rating')} <span className="text-red-500">*</span>
              </label>
              <select
                id="effectiveness_rating"
                name="effectiveness_rating"
                value={formData.effectiveness_rating}
                onChange={handleChange}
                className="input-field"
                required
              >
                {EFFECTIVENESS_RATINGS.map((rating) => (
                  <option key={rating} value={rating}>
                    {t(`knowledgeGraph:effectiveness.ratings.${rating}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="evidence_grade" className="label">
                {t('knowledgeGraph:effectiveness.evidenceGrade')}
              </label>
              <select
                id="evidence_grade"
                name="evidence_grade"
                value={formData.evidence_grade}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">-</option>
                {EVIDENCE_GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade} - {t(`evidence:grade.quality.${grade}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Intervention */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_primary"
              name="is_primary"
              checked={formData.is_primary}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_primary" className="text-sm text-gray-700">
              {t('knowledgeGraph:effectiveness.isPrimary')}
            </label>
            <span className="text-xs text-gray-500">
              ({t('knowledgeGraph:effectiveness.isPrimaryDesc')})
            </span>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">
              {t('knowledgeGraph:effectiveness.notes')}
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input-field"
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

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('knowledgeGraph:effectiveness.noRatings')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((item) => (
            <div
              key={item.id}
              className={`card border ${RATING_COLORS[item.effectiveness_rating]?.split(' ')[2] || 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${RATING_COLORS[item.effectiveness_rating]}`}>
                      {t(`knowledgeGraph:effectiveness.ratings.${item.effectiveness_rating}`)}
                    </span>
                    {item.evidence_grade && (
                      <span className={`px-2 py-1 rounded text-sm ${GRADE_COLORS[item.evidence_grade]}`}>
                        {t('evidence:grade.quality.title', { defaultValue: 'Grade' })} {item.evidence_grade}
                      </span>
                    )}
                    {item.is_primary && (
                      <span className="px-2 py-1 rounded text-sm bg-purple-100 text-purple-700 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {t('knowledgeGraph:effectiveness.isPrimary')}
                      </span>
                    )}
                  </div>

                  {/* Linked Condition/Intervention */}
                  {mode === 'condition' && item.intervention && (
                    <p className="text-sm font-medium text-gray-900">
                      {item.intervention.name}
                      {item.intervention.care_domain && (
                        <span className="text-gray-500 font-normal"> ({item.intervention.care_domain})</span>
                      )}
                    </p>
                  )}
                  {mode === 'intervention' && item.condition && (
                    <p className="text-sm font-medium text-gray-900">
                      {item.condition.name}
                    </p>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                  )}

                  {/* Score */}
                  {item.effectiveness_score !== undefined && (
                    <p className="text-xs text-gray-500 mt-2">
                      {t('knowledgeGraph:effectiveness.score')}: {item.effectiveness_score}/5
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EffectivenessRatingEditor;
