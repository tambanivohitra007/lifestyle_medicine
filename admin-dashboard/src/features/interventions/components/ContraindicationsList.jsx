import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Save,
  Loader2,
  AlertCircle,
  AlertOctagon,
  Info,
} from 'lucide-react';
import api, { apiEndpoints } from '../../../lib/api';
import { toast, confirmDelete } from '../../../lib/swal';

const SEVERITY_CONFIG = {
  absolute: {
    icon: AlertOctagon,
    color: 'bg-red-100 text-red-700 border-red-200',
    badgeColor: 'bg-red-100 text-red-700',
  },
  relative: {
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
  caution: {
    icon: Info,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
};

const ContraindicationsList = ({ interventionId, contraindications, onUpdate }) => {
  const { t } = useTranslation(['interventions', 'common', 'conditions']);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [formData, setFormData] = useState({
    condition_id: '',
    title: '',
    description: '',
    severity: 'relative',
    alternative_recommendation: '',
  });

  useEffect(() => {
    fetchConditions();
  }, []);

  const fetchConditions = async () => {
    try {
      const response = await api.get(apiEndpoints.conditions);
      setConditions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conditions:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      condition_id: '',
      title: '',
      description: '',
      severity: 'relative',
      alternative_recommendation: '',
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
      condition_id: item.condition_id || '',
      title: item.title,
      description: item.description,
      severity: item.severity,
      alternative_recommendation: item.alternative_recommendation || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error(t('common:validation.required', { field: t('interventions:contraindications.contraindicationTitle') }));
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData };
      if (!payload.condition_id) {
        delete payload.condition_id;
      }

      if (editingItem) {
        await api.put(apiEndpoints.contraindication(editingItem.id), payload);
        toast.success(t('interventions:contraindications.toast.updated'));
      } else {
        await api.post(apiEndpoints.interventionContraindicationsAdmin(interventionId), payload);
        toast.success(t('interventions:contraindications.toast.created'));
      }
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving contraindication:', error);
      toast.error(t('interventions:contraindications.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmDelete(item.title);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.contraindication(item.id));
      toast.success(t('interventions:contraindications.toast.deleted'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting contraindication:', error);
      toast.error(t('interventions:contraindications.toast.deleteError'));
    }
  };

  const severityOptions = [
    { value: 'absolute', label: t('interventions:contraindications.severityLevels.absolute') },
    { value: 'relative', label: t('interventions:contraindications.severityLevels.relative') },
    { value: 'caution', label: t('interventions:contraindications.severityLevels.caution') },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('interventions:contraindications.title')}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('interventions:contraindications.addNew')}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              {editingItem
                ? t('interventions:contraindications.edit')
                : t('interventions:contraindications.addNew')}
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
              <label htmlFor="title" className="label">
                {t('interventions:contraindications.contraindicationTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder={t('interventions:contraindications.titlePlaceholder')}
                required
              />
            </div>
            <div>
              <label htmlFor="severity" className="label">
                {t('interventions:contraindications.severity')} <span className="text-red-500">*</span>
              </label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="input-field"
                required
              >
                {severityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t(`interventions:contraindications.severityDescriptions.${formData.severity}`)}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="condition_id" className="label">
              {t('interventions:contraindications.linkedCondition')}
            </label>
            <select
              id="condition_id"
              name="condition_id"
              value={formData.condition_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">{t('interventions:contraindications.selectCondition')}</option>
              {conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="label">
              {t('interventions:contraindications.description')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder={t('interventions:contraindications.descriptionPlaceholder')}
              required
            />
          </div>

          <div>
            <label htmlFor="alternative_recommendation" className="label">
              {t('interventions:contraindications.alternativeRecommendation')}
            </label>
            <textarea
              id="alternative_recommendation"
              name="alternative_recommendation"
              value={formData.alternative_recommendation}
              onChange={handleChange}
              rows={2}
              className="input-field"
              placeholder={t('interventions:contraindications.alternativePlaceholder')}
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

      {/* Contraindications List */}
      {contraindications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('interventions:contraindications.noItems')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contraindications.map((item) => {
            const config = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.caution;
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className={`card border ${config.color.split(' ')[2]} hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.color.split(' ').slice(0, 2).join(' ')}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${config.badgeColor}`}>
                          {t(`interventions:contraindications.severityLevels.${item.severity}`)}
                        </span>
                        {item.condition && (
                          <span className="inline-block ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {item.condition.name}
                          </span>
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
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                      {item.description}
                    </p>
                    {item.alternative_recommendation && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          {t('interventions:contraindications.alternativeRecommendation')}
                        </p>
                        <p className="text-sm text-gray-700">{item.alternative_recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContraindicationsList;
