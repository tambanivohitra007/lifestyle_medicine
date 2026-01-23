import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const STUDY_TYPES = [
  { value: 'rct', label: 'Randomized Controlled Trial' },
  { value: 'meta_analysis', label: 'Meta-Analysis' },
  { value: 'systematic_review', label: 'Systematic Review' },
  { value: 'observational', label: 'Observational Study' },
  { value: 'case_series', label: 'Case Series' },
  { value: 'expert_opinion', label: 'Expert Opinion' },
];

const QUALITY_RATINGS = [
  { value: 'A', label: 'A - High Quality' },
  { value: 'B', label: 'B - Good Quality' },
  { value: 'C', label: 'C - Moderate Quality' },
  { value: 'D', label: 'D - Low Quality' },
];

const EvidenceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    intervention_id: '',
    study_type: '',
    population: '',
    quality_rating: '',
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
        quality_rating: evidence.quality_rating || '',
        summary: evidence.summary || '',
        notes: evidence.notes || '',
      });
    } catch (error) {
      console.error('Error fetching evidence:', error);
      alert('Failed to load evidence');
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
        alert('Failed to save evidence');
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/evidence"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Evidence' : 'New Evidence Entry'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update the evidence details' : 'Add new evidence for an intervention'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
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

          {/* Study Type & Quality Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="study_type" className="label">
                Study Type
              </label>
              <select
                id="study_type"
                name="study_type"
                value={formData.study_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select type</option>
                {STUDY_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quality_rating" className="label">
                Quality Rating
              </label>
              <select
                id="quality_rating"
                name="quality_rating"
                value={formData.quality_rating}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select rating</option>
                {QUALITY_RATINGS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Population */}
          <div>
            <label htmlFor="population" className="label">
              Study Population
            </label>
            <input
              type="text"
              id="population"
              name="population"
              value={formData.population}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Adults with Type 2 Diabetes"
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="label">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Key findings and conclusions..."
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Additional notes or comments..."
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
              {saving ? 'Saving...' : 'Save Evidence'}
            </button>
            <Link to="/evidence" className="btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EvidenceForm;
