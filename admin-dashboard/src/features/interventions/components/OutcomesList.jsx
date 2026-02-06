import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  Target,
  X,
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import api, { apiEndpoints } from '../../../lib/api';
import { toast, confirmDelete } from '../../../lib/swal';

const GRADE_CONFIG = {
  A: { color: 'bg-green-100 text-green-700', label: 'A' },
  B: { color: 'bg-blue-100 text-blue-700', label: 'B' },
  C: { color: 'bg-yellow-100 text-yellow-700', label: 'C' },
  D: { color: 'bg-red-100 text-red-700', label: 'D' },
};

const OutcomesList = ({ interventionId, outcomes, onUpdate }) => {
  const { t } = useTranslation(['interventions', 'common']);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    outcome_measure: '',
    expected_change: '',
    direction: '',
    timeline_weeks: '',
    evidence_grade: '',
    measurement_method: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      outcome_measure: '',
      expected_change: '',
      direction: '',
      timeline_weeks: '',
      evidence_grade: '',
      measurement_method: '',
      notes: '',
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
      outcome_measure: item.outcome_measure,
      expected_change: item.expected_change || '',
      direction: item.direction || '',
      timeline_weeks: item.timeline_weeks || '',
      evidence_grade: item.evidence_grade || '',
      measurement_method: item.measurement_method || '',
      notes: item.notes || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.outcome_measure.trim()) {
      toast.error(t('common:validation.required', { field: t('interventions:outcomes.outcomeMeasure') }));
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await api.put(apiEndpoints.outcome(editingItem.id), formData);
        toast.success(t('interventions:outcomes.toast.updated'));
      } else {
        await api.post(apiEndpoints.interventionOutcomesAdmin(interventionId), formData);
        toast.success(t('interventions:outcomes.toast.created'));
      }
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving outcome:', error);
      toast.error(t('interventions:outcomes.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmDelete(item.outcome_measure);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.outcome(item.id));
      toast.success(t('interventions:outcomes.toast.deleted'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting outcome:', error);
      toast.error(t('interventions:outcomes.toast.deleteError'));
    }
  };

  const getDirectionIcon = (direction) => {
    if (!direction) return null;
    const d = direction.toLowerCase();
    if (d.includes('increase') || d.includes('improve') || d.includes('up')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    if (d.includes('decrease') || d.includes('reduce') || d.includes('down') || d.includes('lower')) {
      return <TrendingDown className="w-4 h-4 text-blue-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const gradeOptions = ['A', 'B', 'C', 'D'];
  const sortedOutcomes = [...outcomes].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('interventions:outcomes.title')}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('interventions:outcomes.addNew')}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              {editingItem
                ? t('interventions:outcomes.edit')
                : t('interventions:outcomes.addNew')}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="outcome_measure" className="label">
                {t('interventions:outcomes.outcomeMeasure')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="outcome_measure"
                name="outcome_measure"
                value={formData.outcome_measure}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:outcomes.measurePlaceholder')}
                required
              />
            </div>
            <div>
              <label htmlFor="expected_change" className="label">
                {t('interventions:outcomes.expectedChange')}
              </label>
              <input
                type="text"
                id="expected_change"
                name="expected_change"
                value={formData.expected_change}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:outcomes.expectedChangePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="direction" className="label">
                {t('interventions:outcomes.direction')}
              </label>
              <input
                type="text"
                id="direction"
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:outcomes.directionPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="timeline_weeks" className="label">
                {t('interventions:outcomes.timelineWeeks')}
              </label>
              <input
                type="number"
                id="timeline_weeks"
                name="timeline_weeks"
                value={formData.timeline_weeks}
                onChange={handleChange}
                className="input-field"
                min="1"
                max="520"
              />
            </div>
            <div>
              <label htmlFor="evidence_grade" className="label">
                {t('interventions:outcomes.evidenceGrade')}
              </label>
              <select
                id="evidence_grade"
                name="evidence_grade"
                value={formData.evidence_grade}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">-</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade} - {t(`interventions:outcomes.gradeDescriptions.${grade}`).split(' ').slice(0, 2).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="measurement_method" className="label">
                {t('interventions:outcomes.measurementMethod')}
              </label>
              <input
                type="text"
                id="measurement_method"
                name="measurement_method"
                value={formData.measurement_method}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:outcomes.measurementPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="label">
              {t('interventions:outcomes.notes')}
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="input-field"
              placeholder={t('interventions:outcomes.notesPlaceholder')}
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

      {/* Outcomes List */}
      {sortedOutcomes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('interventions:outcomes.noItems')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedOutcomes.map((item) => {
            const gradeConfig = item.evidence_grade ? GRADE_CONFIG[item.evidence_grade] : null;

            return (
              <div
                key={item.id}
                className="card border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-500" />
                    <h4 className="font-medium text-gray-900">{item.outcome_measure}</h4>
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

                <div className="flex flex-wrap gap-2 mb-3">
                  {item.expected_change && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                      {getDirectionIcon(item.direction)}
                      <span>{item.expected_change}</span>
                    </div>
                  )}
                  {item.timeline_weeks && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {item.timeline_weeks} {t('common:units.weeks')}
                    </span>
                  )}
                  {gradeConfig && (
                    <span className={`px-2 py-1 rounded text-sm font-medium ${gradeConfig.color}`}>
                      Grade {gradeConfig.label}
                    </span>
                  )}
                </div>

                {item.measurement_method && (
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">{t('interventions:outcomes.measurementMethod')}:</span>{' '}
                    {item.measurement_method}
                  </p>
                )}

                {item.notes && (
                  <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
                    {item.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OutcomesList;
