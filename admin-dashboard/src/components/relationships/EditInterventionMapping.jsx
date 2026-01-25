import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import Modal from '../ui/Modal';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';

const EVIDENCE_OPTIONS = [
  { value: 'high', label: 'High', description: 'Strong research support', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'moderate', label: 'Moderate', description: 'Good research support', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'emerging', label: 'Emerging', description: 'Promising early research', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'insufficient', label: 'Insufficient', description: 'Limited research available', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const RECOMMENDATION_OPTIONS = [
  { value: 'core', label: 'Core', description: 'Essential intervention', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'adjunct', label: 'Adjunct', description: 'Supportive intervention', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'optional', label: 'Optional', description: 'Consider based on patient', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const EditInterventionMapping = ({
  isOpen,
  onClose,
  conditionId,
  intervention,
  currentMapping,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    strength_of_evidence: 'moderate',
    recommendation_level: 'adjunct',
    clinical_notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Initialize form with current mapping data
  useEffect(() => {
    if (currentMapping) {
      setFormData({
        strength_of_evidence: currentMapping.strength_of_evidence || 'moderate',
        recommendation_level: currentMapping.recommendation_level || 'adjunct',
        clinical_notes: currentMapping.clinical_notes || '',
      });
    }
  }, [currentMapping]);

  const handleSave = async () => {
    if (!intervention || !conditionId) return;

    setSaving(true);
    try {
      const res = await api.put(
        apiEndpoints.updateConditionIntervention(conditionId, intervention.id),
        formData
      );

      toast.success('Intervention mapping updated');
      onSave?.(formData);
      onClose();
    } catch (error) {
      console.error('Error updating intervention mapping:', error);
      toast.error('Failed to update mapping');
    } finally {
      setSaving(false);
    }
  };

  if (!intervention) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Intervention Relationship"
      size="lg"
    >
      <div className="space-y-6">
        {/* Intervention Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900">{intervention.name}</h3>
          {intervention.care_domain && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full">
              {intervention.care_domain.name}
            </span>
          )}
          {intervention.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {intervention.description}
            </p>
          )}
        </div>

        {/* Strength of Evidence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strength of Evidence
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EVIDENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, strength_of_evidence: opt.value }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  formData.strength_of_evidence === opt.value
                    ? `${opt.color} border-current`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs opacity-75 mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recommendation Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {RECOMMENDATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, recommendation_level: opt.value }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  formData.recommendation_level === opt.value
                    ? `${opt.color} border-current`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs opacity-75 mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Notes
          </label>
          <textarea
            value={formData.clinical_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, clinical_notes: e.target.value }))}
            placeholder="Add specific notes about applying this intervention for this condition..."
            rows={3}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            These notes provide context-specific guidance for this intervention-condition pairing.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="btn-outline"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditInterventionMapping;
