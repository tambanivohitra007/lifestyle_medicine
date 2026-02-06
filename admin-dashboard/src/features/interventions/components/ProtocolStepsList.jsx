import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ListOrdered,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api, { apiEndpoints } from '../../../lib/api';
import { toast, confirmDelete } from '../../../lib/swal';

const ProtocolStepsList = ({ interventionId, protocol, steps, onUpdate }) => {
  const { t } = useTranslation(['interventions', 'common']);
  const [editingStep, setEditingStep] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [formData, setFormData] = useState({
    step_number: steps.length + 1,
    phase_name: '',
    title: '',
    description: '',
    duration_minutes: '',
    week_start: '',
    week_end: '',
    frequency: '',
    instructions: '',
    tips: '',
  });

  const resetForm = () => {
    setFormData({
      step_number: steps.length + 1,
      phase_name: '',
      title: '',
      description: '',
      duration_minutes: '',
      week_start: '',
      week_end: '',
      frequency: '',
      instructions: '',
      tips: '',
    });
    setEditingStep(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (step) => {
    setFormData({
      step_number: step.step_number,
      phase_name: step.phase_name || '',
      title: step.title,
      description: step.description || '',
      duration_minutes: step.duration_minutes || '',
      week_start: step.week_start || '',
      week_end: step.week_end || '',
      frequency: step.frequency || '',
      instructions: step.instructions || '',
      tips: step.tips || '',
    });
    setEditingStep(step);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(t('common:validation.required', { field: t('interventions:protocol.steps.stepTitle') }));
      return;
    }

    try {
      setSaving(true);
      if (editingStep) {
        await api.put(apiEndpoints.protocolStep(editingStep.id), formData);
        toast.success(t('interventions:protocol.toast.stepUpdated'));
      } else {
        await api.post(apiEndpoints.interventionProtocolSteps(interventionId), formData);
        toast.success(t('interventions:protocol.toast.stepCreated'));
      }
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving step:', error);
      toast.error(t('interventions:protocol.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (step) => {
    const confirmed = await confirmDelete(step.title);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.protocolStep(step.id));
      toast.success(t('interventions:protocol.toast.stepDeleted'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error(t('interventions:protocol.toast.deleteError'));
    }
  };

  const toggleExpand = (stepId) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const sortedSteps = [...steps].sort((a, b) => a.step_number - b.step_number);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('interventions:protocol.steps.title')}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('interventions:protocol.steps.addStep')}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              {editingStep
                ? t('interventions:protocol.steps.editStep')
                : t('interventions:protocol.steps.addStep')}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="step_number" className="label">
                {t('interventions:protocol.steps.stepNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="step_number"
                name="step_number"
                value={formData.step_number}
                onChange={handleChange}
                className="input-field"
                min="1"
                required
              />
            </div>
            <div>
              <label htmlFor="phase_name" className="label">
                {t('interventions:protocol.steps.phaseName')}
              </label>
              <input
                type="text"
                id="phase_name"
                name="phase_name"
                value={formData.phase_name}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:protocol.steps.phaseNamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="title" className="label">
                {t('interventions:protocol.steps.stepTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:protocol.steps.stepTitlePlaceholder')}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="label">
              {t('interventions:protocol.steps.stepDescription')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="input-field"
              placeholder={t('interventions:protocol.steps.stepDescriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="duration_minutes" className="label">
                {t('interventions:protocol.steps.durationMinutes')}
              </label>
              <input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                className="input-field"
                min="1"
              />
            </div>
            <div>
              <label htmlFor="week_start" className="label">
                {t('interventions:protocol.steps.weekStart')}
              </label>
              <input
                type="number"
                id="week_start"
                name="week_start"
                value={formData.week_start}
                onChange={handleChange}
                className="input-field"
                min="1"
              />
            </div>
            <div>
              <label htmlFor="week_end" className="label">
                {t('interventions:protocol.steps.weekEnd')}
              </label>
              <input
                type="number"
                id="week_end"
                name="week_end"
                value={formData.week_end}
                onChange={handleChange}
                className="input-field"
                min="1"
              />
            </div>
            <div>
              <label htmlFor="frequency" className="label">
                {t('interventions:protocol.steps.frequency')}
              </label>
              <input
                type="text"
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:protocol.steps.frequencyPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="instructions" className="label">
              {t('interventions:protocol.steps.instructions')}
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder={t('interventions:protocol.steps.instructionsPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="tips" className="label">
              {t('interventions:protocol.steps.tips')}
            </label>
            <textarea
              id="tips"
              name="tips"
              value={formData.tips}
              onChange={handleChange}
              rows={2}
              className="input-field"
              placeholder={t('interventions:protocol.steps.tipsPlaceholder')}
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

      {/* Steps List */}
      {sortedSteps.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ListOrdered className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('interventions:protocol.steps.noSteps')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSteps.map((step) => (
            <div
              key={step.id}
              className="card border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {step.step_number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                      {step.phase_name && (
                        <span className="inline-block px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full mt-1">
                          {step.phase_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleExpand(step.id)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      >
                        {expandedSteps.has(step.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(step)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(step)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Collapsed info */}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {step.duration_minutes && (
                      <span>{step.duration_minutes} min</span>
                    )}
                    {(step.week_start || step.week_end) && (
                      <span>
                        {step.week_start && step.week_end
                          ? `Week ${step.week_start}-${step.week_end}`
                          : step.week_start
                          ? `Week ${step.week_start}+`
                          : `Until week ${step.week_end}`}
                      </span>
                    )}
                    {step.frequency && <span>{step.frequency}</span>}
                  </div>

                  {/* Expanded details */}
                  {expandedSteps.has(step.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      {step.description && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {t('interventions:protocol.steps.stepDescription')}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {step.description}
                          </p>
                        </div>
                      )}
                      {step.instructions && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {t('interventions:protocol.steps.instructions')}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {step.instructions}
                          </p>
                        </div>
                      )}
                      {step.tips && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {t('interventions:protocol.steps.tips')}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {step.tips}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProtocolStepsList;
