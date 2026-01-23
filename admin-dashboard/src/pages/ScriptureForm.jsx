import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast } from '../lib/swal';

const ScriptureForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    reference: '',
    text: '',
    theme: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchScripture();
    }
  }, [id]);

  const fetchScripture = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.scriptures}/${id}`);
      const scripture = response.data.data;
      setFormData({
        reference: scripture.reference || '',
        text: scripture.text || '',
        theme: scripture.theme || '',
      });
    } catch (error) {
      console.error('Error fetching scripture:', error);
      toast.error('Failed to load scripture');
      navigate('/scriptures');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference.trim()) {
      newErrors.reference = 'Reference is required';
    }
    if (!formData.text.trim()) {
      newErrors.text = 'Text is required';
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
        await api.put(`${apiEndpoints.scripturesAdmin}/${id}`, formData);
      } else {
        await api.post(apiEndpoints.scripturesAdmin, formData);
      }
      navigate('/scriptures');
    } catch (error) {
      console.error('Error saving scripture:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Failed to save scripture');
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
          to="/scriptures"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Scripture' : 'New Scripture'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update the scripture details' : 'Add a new scripture reference'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="space-y-6">
          <div>
            <label htmlFor="reference" className="label">
              Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className={`input-field ${errors.reference ? 'border-red-500' : ''}`}
              placeholder="e.g., John 3:16, Psalm 23:1-6"
            />
            {errors.reference && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.reference) ? errors.reference[0] : errors.reference}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="text" className="label">
              Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              rows={5}
              className={`input-field ${errors.text ? 'border-red-500' : ''}`}
              placeholder="Enter the scripture text..."
            />
            {errors.text && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.text) ? errors.text[0] : errors.text}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="theme" className="label">
              Theme
            </label>
            <input
              type="text"
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Healing, Peace, Faith"
            />
          </div>

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
              {saving ? 'Saving...' : 'Save Scripture'}
            </button>
            <Link to="/scriptures" className="btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ScriptureForm;
