import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  Link2,
  X,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Minus,
  Zap,
  Shield,
} from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';

const RELATIONSHIP_TYPES = ['synergy', 'complementary', 'neutral', 'caution', 'conflict'];

const RELATIONSHIP_COLORS = {
  synergy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  complementary: 'bg-green-100 text-green-700 border-green-200',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  caution: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  conflict: 'bg-red-100 text-red-700 border-red-200',
};

const RELATIONSHIP_ICONS = {
  synergy: Zap,
  complementary: CheckCircle,
  neutral: Minus,
  caution: AlertTriangle,
  conflict: Shield,
};

const InterventionRelationshipEditor = ({
  interventionId,
  interventions = [],
}) => {
  const { t } = useTranslation(['knowledgeGraph', 'common', 'interventions']);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'synergies' | 'conflicts'
  const [formData, setFormData] = useState({
    intervention_a_id: interventionId || '',
    intervention_b_id: '',
    relationship_type: 'complementary',
    description: '',
    clinical_notes: '',
  });

  useEffect(() => {
    fetchRelationships();
  }, [interventionId, filter]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      let response;

      if (interventionId) {
        if (filter === 'synergies') {
          response = await api.get(apiEndpoints.interventionSynergies(interventionId));
        } else if (filter === 'conflicts') {
          response = await api.get(apiEndpoints.interventionConflicts(interventionId));
        } else {
          response = await api.get(apiEndpoints.interventionRelationshipsFor(interventionId));
        }
      } else {
        const params = new URLSearchParams();
        if (filter === 'synergies') params.append('synergies', '1');
        if (filter === 'conflicts') params.append('conflicts', '1');
        response = await api.get(`${apiEndpoints.interventionRelationships}?${params.toString()}`);
      }
      setRelationships(response.data.data || []);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      setRelationships([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      intervention_a_id: interventionId || '',
      intervention_b_id: '',
      relationship_type: 'complementary',
      description: '',
      clinical_notes: '',
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
      intervention_a_id: item.intervention_a_id,
      intervention_b_id: item.intervention_b_id,
      relationship_type: item.relationship_type || 'complementary',
      description: item.description || '',
      clinical_notes: item.clinical_notes || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.intervention_a_id || !formData.intervention_b_id) {
      toast.error(t('common:validation.required', { field: t('knowledgeGraph:relationships.interventionA') }));
      return;
    }
    if (formData.intervention_a_id === formData.intervention_b_id) {
      toast.error(t('common:validation.different'));
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData };

      // Clean up empty values
      if (!payload.description) delete payload.description;
      if (!payload.clinical_notes) delete payload.clinical_notes;

      if (editingItem) {
        await api.put(apiEndpoints.interventionRelationshipAdmin(editingItem.id), payload);
        toast.success(t('common:toast.updated'));
      } else {
        await api.post(apiEndpoints.interventionRelationshipsAdmin, payload);
        toast.success(t('common:toast.created'));
      }
      resetForm();
      fetchRelationships();
    } catch (error) {
      console.error('Error saving relationship:', error);
      if (error.response?.status === 422 && error.response?.data?.existing_id) {
        toast.error(t('knowledgeGraph:relationships.existingRelationship'));
      } else {
        toast.error(t('common:toast.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmDelete(t('knowledgeGraph:relationships.title'));
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.interventionRelationshipAdmin(item.id));
      toast.success(t('common:toast.deleted'));
      fetchRelationships();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      toast.error(t('common:toast.deleteError'));
    }
  };

  const getOtherIntervention = (relationship) => {
    if (!interventionId) return null;
    if (relationship.intervention_a_id === interventionId) {
      return relationship.intervention_b;
    }
    return relationship.intervention_a;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('knowledgeGraph:relationships.title')}
        </h3>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field text-sm py-1.5"
          >
            <option value="all">{t('common:all')}</option>
            <option value="synergies">{t('knowledgeGraph:relationships.synergies')}</option>
            <option value="conflicts">{t('knowledgeGraph:relationships.conflicts')}</option>
          </select>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('knowledgeGraph:relationships.addRelationship')}
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              {editingItem ? t('knowledgeGraph:relationships.editRelationship') : t('knowledgeGraph:relationships.addRelationship')}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Intervention Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="intervention_a_id" className="label">
                {t('knowledgeGraph:relationships.interventionA')} <span className="text-red-500">*</span>
              </label>
              <select
                id="intervention_a_id"
                name="intervention_a_id"
                value={formData.intervention_a_id}
                onChange={handleChange}
                className="input-field"
                required
                disabled={!!interventionId || !!editingItem}
              >
                <option value="">{t('knowledgeGraph:relationships.selectFirst')}</option>
                {interventions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="intervention_b_id" className="label">
                {t('knowledgeGraph:relationships.interventionB')} <span className="text-red-500">*</span>
              </label>
              <select
                id="intervention_b_id"
                name="intervention_b_id"
                value={formData.intervention_b_id}
                onChange={handleChange}
                className="input-field"
                required
                disabled={!!editingItem}
              >
                <option value="">{t('knowledgeGraph:relationships.selectSecond')}</option>
                {interventions
                  .filter((i) => i.id !== formData.intervention_a_id)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Relationship Type */}
          <div>
            <label htmlFor="relationship_type" className="label">
              {t('knowledgeGraph:relationships.type')} <span className="text-red-500">*</span>
            </label>
            <select
              id="relationship_type"
              name="relationship_type"
              value={formData.relationship_type}
              onChange={handleChange}
              className="input-field"
              required
            >
              {RELATIONSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`knowledgeGraph:relationships.types.${type}`)} - {t(`knowledgeGraph:relationships.typeDescriptions.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="label">
              {t('knowledgeGraph:relationships.description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="input-field"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label htmlFor="clinical_notes" className="label">
              {t('knowledgeGraph:relationships.clinicalNotes')}
            </label>
            <textarea
              id="clinical_notes"
              name="clinical_notes"
              value={formData.clinical_notes}
              onChange={handleChange}
              rows={2}
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

      {/* Relationships List */}
      {relationships.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('knowledgeGraph:relationships.noRelationships')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {relationships.map((item) => {
            const Icon = RELATIONSHIP_ICONS[item.relationship_type] || Link2;
            const otherIntervention = interventionId ? getOtherIntervention(item) : null;

            return (
              <div
                key={item.id}
                className={`card border ${RELATIONSHIP_COLORS[item.relationship_type]?.split(' ')[2] || 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium flex items-center gap-1 ${RELATIONSHIP_COLORS[item.relationship_type]}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {t(`knowledgeGraph:relationships.types.${item.relationship_type}`)}
                      </span>
                      {item.is_positive && (
                        <span className="px-2 py-1 rounded text-xs bg-green-50 text-green-600">
                          {t('knowledgeGraph:relationships.positive')}
                        </span>
                      )}
                      {item.is_negative && (
                        <span className="px-2 py-1 rounded text-xs bg-red-50 text-red-600">
                          {t('knowledgeGraph:relationships.negative')}
                        </span>
                      )}
                    </div>

                    {/* Interventions */}
                    {interventionId && otherIntervention ? (
                      <p className="text-sm font-medium text-gray-900">
                        {otherIntervention.name}
                        {otherIntervention.care_domain && (
                          <span className="text-gray-500 font-normal"> ({otherIntervention.care_domain})</span>
                        )}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">
                          {item.intervention_a?.name || '-'}
                        </span>
                        <span className="text-gray-400">↔</span>
                        <span className="font-medium text-gray-900">
                          {item.intervention_b?.name || '-'}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}

                    {/* Clinical Notes */}
                    {item.clinical_notes && (
                      <div className="mt-2 p-2 bg-white rounded text-xs text-gray-500">
                        <span className="font-medium">{t('knowledgeGraph:relationships.clinicalNotes')}:</span> {item.clinical_notes}
                      </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InterventionRelationshipEditor;
