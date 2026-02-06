import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2, ExternalLink } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const ReferenceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    citation: '',
    doi: '',
    pmid: '',
    url: '',
    year: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchReference();
    }
  }, [id]);

  const fetchReference = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.references}/${id}`);
      const reference = response.data.data;
      setFormData({
        citation: reference.citation || '',
        doi: reference.doi || '',
        pmid: reference.pmid || '',
        url: reference.url || '',
        year: reference.year || '',
      });
    } catch (error) {
      console.error('Error fetching reference:', error);
      toast.error('Failed to load reference');
      navigate('/references');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.citation.trim()) {
      newErrors.citation = 'Citation is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
      };

      if (isEditing) {
        await api.put(`${apiEndpoints.referencesAdmin}/${id}`, payload);
      } else {
        await api.post(apiEndpoints.referencesAdmin, payload);
      }
      navigate('/references');
    } catch (error) {
      console.error('Error saving reference:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Failed to save reference');
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'References', href: '/references' },
          { label: isEditing ? 'Edit Reference' : 'New Reference' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Reference' : 'New Reference'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update the reference details' : 'Add a new scientific reference'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Citation */}
          <div>
            <label htmlFor="citation" className="label">
              Citation <span className="text-red-500">*</span>
            </label>
            <textarea
              id="citation"
              name="citation"
              value={formData.citation}
              onChange={handleChange}
              rows={3}
              className={`input-field ${errors.citation ? 'border-red-500' : ''}`}
              placeholder="Full citation text (e.g., Author A, Author B. Title. Journal. Year;Volume:Pages)"
            />
            {errors.citation && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.citation) ? errors.citation[0] : errors.citation}
              </p>
            )}
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="label">
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 2023"
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>

          {/* DOI & PMID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* DOI */}
            <div>
              <label htmlFor="doi" className="label">
                DOI
              </label>
              <input
                type="text"
                id="doi"
                name="doi"
                value={formData.doi}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 10.1000/xyz123"
              />
              <div className="mt-1 flex items-center gap-3">
                {formData.doi && (
                  <a
                    href={`https://doi.org/${formData.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    View article
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <a
                  href="https://www.doi.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  What is DOI?
                </a>
              </div>
            </div>

            {/* PMID */}
            <div>
              <label htmlFor="pmid" className="label">
                PubMed ID (PMID)
              </label>
              <input
                type="text"
                id="pmid"
                name="pmid"
                value={formData.pmid}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 12345678"
              />
              <div className="mt-1 flex items-center gap-3">
                {formData.pmid && (
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${formData.pmid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    View on PubMed
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Search PubMed
                </a>
              </div>
            </div>
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="label">
              URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="input-field"
              placeholder="https://..."
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
              {saving ? 'Saving...' : 'Save Reference'}
            </button>
            <Link to="/references" className="btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReferenceForm;
