import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import RichTextEditor from '../components/Editor/RichTextEditor';

const SECTION_TYPES = [
  { value: 'risk_factors', label: 'Risk Factors' },
  { value: 'physiology', label: 'Physiology' },
  { value: 'complications', label: 'Complications' },
  { value: 'solutions', label: 'Lifestyle Solutions' },
  { value: 'additional_factors', label: 'Additional Factors' },
  { value: 'scripture', label: 'Scripture / SOP' },
];

const ConditionSectionForm = () => {
  const { id: conditionId, sectionId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(sectionId);

  const [condition, setCondition] = useState(null);
  const [formData, setFormData] = useState({
    condition_id: conditionId,
    section_type: '',
    title: '',
    body: '',
    order_index: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCondition();
    if (isEditing) {
      fetchSection();
    } else {
      setLoading(false);
    }
  }, [conditionId, sectionId]);

  const fetchCondition = async () => {
    try {
      const response = await api.get(`${apiEndpoints.conditions}/${conditionId}`);
      setCondition(response.data.data);
    } catch (error) {
      console.error('Error fetching condition:', error);
    }
  };

  const fetchSection = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.conditionSectionsAdmin}/${sectionId}`);
      const section = response.data.data;
      setFormData({
        condition_id: conditionId,
        section_type: section.section_type || '',
        title: section.title || '',
        body: section.body || '',
        order_index: section.order_index || 0,
      });
    } catch (error) {
      console.error('Error fetching section:', error);
      alert('Failed to load section');
      navigate(`/conditions/${conditionId}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.section_type) {
      newErrors.section_type = 'Section type is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
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
        await api.put(`${apiEndpoints.conditionSectionsAdmin}/${sectionId}`, formData);
      } else {
        await api.post(apiEndpoints.conditionSectionsAdmin, formData);
      }
      navigate(`/conditions/${conditionId}`);
    } catch (error) {
      console.error('Error saving section:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save section');
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
          to={`/conditions/${conditionId}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Section' : 'New Section'}
          </h1>
          {condition && (
            <p className="text-gray-600 mt-1">
              For condition: <span className="font-medium">{condition.name}</span>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="space-y-6">
          {/* Section Type */}
          <div>
            <label htmlFor="section_type" className="label">
              Section Type <span className="text-red-500">*</span>
            </label>
            <select
              id="section_type"
              name="section_type"
              value={formData.section_type}
              onChange={handleChange}
              className={`input-field ${errors.section_type ? 'border-red-500' : ''}`}
            >
              <option value="">Select a section type</option>
              {SECTION_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.section_type && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.section_type) ? errors.section_type[0] : errors.section_type}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Section title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.title) ? errors.title[0] : errors.title}
              </p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="label">Content</label>
            <RichTextEditor
              content={formData.body}
              onChange={(html) =>
                setFormData((prev) => ({ ...prev, body: html }))
              }
              placeholder="Start writing the section content..."
            />
          </div>

          {/* Order Index */}
          <div>
            <label htmlFor="order_index" className="label">
              Display Order
            </label>
            <input
              type="number"
              id="order_index"
              name="order_index"
              value={formData.order_index}
              onChange={handleChange}
              className="input-field w-32"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first
            </p>
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
              {saving ? 'Saving...' : 'Save Section'}
            </button>
            <Link to={`/conditions/${conditionId}`} className="btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConditionSectionForm;
