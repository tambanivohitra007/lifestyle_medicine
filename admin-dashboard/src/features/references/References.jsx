import { useEffect, useState } from 'react';
import { Plus, Search, BookMarked, Edit, Trash2, ExternalLink, Download, Save, Loader2 } from 'lucide-react';
import api, { apiEndpoints, getApiBaseUrl } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import SlideOver from '../../components/shared/SlideOver';

const References = () => {
  const { canEdit } = useAuth();
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    citation: '',
    doi: '',
    pmid: '',
    url: '',
    year: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, yearFilter]);

  useEffect(() => {
    fetchReferences();
  }, [searchTerm, yearFilter, currentPage]);

  const fetchReferences = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (searchTerm) params.search = searchTerm;
      if (yearFilter) params.year = yearFilter;

      const response = await api.get(apiEndpoints.references, { params });
      setReferences(response.data.data);
      setPagination({
        total: response.data.meta?.total || response.data.data.length,
        lastPage: response.data.meta?.last_page || 1,
        perPage: response.data.meta?.per_page || 20,
      });
    } catch (error) {
      console.error('Error fetching references:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, citation) => {
    const confirmed = await confirmDelete(citation ? `"${citation.substring(0, 50)}..."` : 'this reference');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.referencesAdmin}/${id}`);
      toast.success('Reference deleted');
      fetchReferences();
    } catch (error) {
      console.error('Error deleting reference:', error);
      toast.error('Failed to delete reference');
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      citation: '',
      doi: '',
      pmid: '',
      url: '',
      year: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setEditingId(id);
    setErrors({});
    setIsModalOpen(true);
    setFormLoading(true);

    try {
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
      setIsModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      citation: '',
      doi: '',
      pmid: '',
      url: '',
      year: '',
    });
    setErrors({});
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

      if (editingId) {
        await api.put(`${apiEndpoints.referencesAdmin}/${editingId}`, payload);
        toast.success('Reference updated');
      } else {
        await api.post(apiEndpoints.referencesAdmin, payload);
        toast.success('Reference created');
      }
      closeModal();
      fetchReferences();
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

  const years = [...new Set(references.map((r) => r.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">References</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage citations and scientific references
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <a
            href={`${getApiBaseUrl()}/api/v1${apiEndpoints.exportReferencesCsv}`}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </a>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Reference
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by citation, DOI, or PMID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* References List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : references.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <BookMarked className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No references found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Get started by adding scientific references.
          </p>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Reference
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {references.map((reference) => (
              <div
                key={reference.id}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <BookMarked className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      {reference.year && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {reference.year}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-900 mb-2 text-sm sm:text-base">{reference.citation}</p>

                    <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                      {reference.doi && (
                        <a
                          href={`https://doi.org/${reference.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          DOI: {reference.doi}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {reference.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          PMID: {reference.pmid}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {reference.url && (
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          Link
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex gap-1 self-end sm:self-start">
                      <button
                        onClick={() => openEditModal(reference.id)}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(reference.id, reference.citation)}
                        className="action-btn hover:bg-red-50 active:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.lastPage}
            onPageChange={setCurrentPage}
            totalItems={pagination.total}
            itemsPerPage={pagination.perPage}
          />
        </>
      )}

      {/* SlideOver Modal for Create/Edit */}
      <SlideOver
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Reference' : 'New Reference'}
        subtitle={editingId ? 'Update the reference details' : 'Add a new scientific reference'}
        size="md"
      >
        {formLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`input-field resize-y ${errors.citation ? 'border-red-500' : ''}`}
                placeholder="Full citation text (e.g., Author A, Author B. Title. Journal. Year;Volume:Pages)"
                autoFocus
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
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? 'Saving...' : 'Save Reference'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="btn-outline w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </SlideOver>
    </div>
  );
};

export default References;
