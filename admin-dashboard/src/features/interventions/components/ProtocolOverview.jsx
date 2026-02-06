import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Loader2,
  Trash2,
  ClipboardList,
  Plus,
} from 'lucide-react';
import api, { apiEndpoints } from '../../../lib/api';
import { toast, confirmDelete } from '../../../lib/swal';

const ProtocolOverview = ({ interventionId, protocol, onUpdate }) => {
  const { t } = useTranslation(['interventions', 'common']);
  const [editing, setEditing] = useState(!protocol);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    version: protocol?.version || '1.0',
    duration_weeks: protocol?.duration_weeks || '',
    frequency_per_week: protocol?.frequency_per_week || '',
    intensity_level: protocol?.intensity_level || '',
    overview: protocol?.overview || '',
    prerequisites: protocol?.prerequisites || '',
    equipment_needed: protocol?.equipment_needed || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(apiEndpoints.interventionProtocolAdmin(interventionId), formData);
      toast.success(
        protocol
          ? t('interventions:protocol.toast.updated')
          : t('interventions:protocol.toast.created')
      );
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving protocol:', error);
      toast.error(t('interventions:protocol.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete(t('interventions:protocol.title'));
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.interventionProtocolAdmin(interventionId));
      toast.success(t('interventions:protocol.toast.deleted'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting protocol:', error);
      toast.error(t('interventions:protocol.toast.deleteError'));
    }
  };

  const intensityLevels = [
    { value: 'low', label: t('interventions:protocol.intensity.low') },
    { value: 'moderate', label: t('interventions:protocol.intensity.moderate') },
    { value: 'high', label: t('interventions:protocol.intensity.high') },
    { value: 'variable', label: t('interventions:protocol.intensity.variable') },
  ];

  // View mode
  if (protocol && !editing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('interventions:protocol.overview')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="btn-outline text-sm"
            >
              {t('interventions:protocol.editProtocol')}
            </button>
            <button
              onClick={handleDelete}
              className="btn-outline text-red-600 border-red-200 hover:bg-red-50 text-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {protocol.version && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">{t('interventions:protocol.version')}</p>
              <p className="font-medium">{protocol.version}</p>
            </div>
          )}
          {protocol.duration_weeks && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">{t('interventions:protocol.durationWeeks')}</p>
              <p className="font-medium">{protocol.duration_weeks} {t('common:units.weeks')}</p>
            </div>
          )}
          {protocol.frequency_per_week && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">{t('interventions:protocol.frequencyPerWeek')}</p>
              <p className="font-medium">{protocol.frequency_per_week}x / {t('common:units.week')}</p>
            </div>
          )}
          {protocol.intensity_level && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">{t('interventions:protocol.intensityLevel')}</p>
              <p className="font-medium">
                {t(`interventions:protocol.intensity.${protocol.intensity_level}`)}
              </p>
            </div>
          )}
        </div>

        {protocol.overview && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {t('interventions:protocol.overview')}
            </h4>
            <p className="text-gray-600 whitespace-pre-wrap">{protocol.overview}</p>
          </div>
        )}

        {protocol.prerequisites && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {t('interventions:protocol.prerequisites')}
            </h4>
            <p className="text-gray-600 whitespace-pre-wrap">{protocol.prerequisites}</p>
          </div>
        )}

        {protocol.equipment_needed && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {t('interventions:protocol.equipmentNeeded')}
            </h4>
            <p className="text-gray-600 whitespace-pre-wrap">{protocol.equipment_needed}</p>
          </div>
        )}
      </div>
    );
  }

  // Empty state / Create mode
  if (!protocol && !editing) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('interventions:protocol.noProtocol')}
        </h3>
        <button
          onClick={() => setEditing(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('interventions:protocol.createProtocol')}
        </button>
      </div>
    );
  }

  // Edit mode
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {protocol
            ? t('interventions:protocol.editProtocol')
            : t('interventions:protocol.createProtocol')}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="version" className="label">
            {t('interventions:protocol.version')}
          </label>
          <input
            type="text"
            id="version"
            name="version"
            value={formData.version}
            onChange={handleChange}
            className="input-field"
            placeholder={t('interventions:protocol.versionPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="duration_weeks" className="label">
            {t('interventions:protocol.durationWeeks')}
          </label>
          <input
            type="number"
            id="duration_weeks"
            name="duration_weeks"
            value={formData.duration_weeks}
            onChange={handleChange}
            className="input-field"
            min="1"
            max="520"
          />
        </div>

        <div>
          <label htmlFor="frequency_per_week" className="label">
            {t('interventions:protocol.frequencyPerWeek')}
          </label>
          <input
            type="number"
            id="frequency_per_week"
            name="frequency_per_week"
            value={formData.frequency_per_week}
            onChange={handleChange}
            className="input-field"
            min="1"
            max="21"
          />
        </div>

        <div>
          <label htmlFor="intensity_level" className="label">
            {t('interventions:protocol.intensityLevel')}
          </label>
          <select
            id="intensity_level"
            name="intensity_level"
            value={formData.intensity_level}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">-</option>
            {intensityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="overview" className="label">
          {t('interventions:protocol.overview')}
        </label>
        <textarea
          id="overview"
          name="overview"
          value={formData.overview}
          onChange={handleChange}
          rows={4}
          className="input-field"
          placeholder={t('interventions:protocol.overviewPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="prerequisites" className="label">
          {t('interventions:protocol.prerequisites')}
        </label>
        <textarea
          id="prerequisites"
          name="prerequisites"
          value={formData.prerequisites}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder={t('interventions:protocol.prerequisitesPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="equipment_needed" className="label">
          {t('interventions:protocol.equipmentNeeded')}
        </label>
        <textarea
          id="equipment_needed"
          name="equipment_needed"
          value={formData.equipment_needed}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder={t('interventions:protocol.equipmentNeededPlaceholder')}
        />
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
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
        {protocol && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn-outline"
          >
            {t('common:buttons.cancel')}
          </button>
        )}
      </div>
    </form>
  );
};

export default ProtocolOverview;
