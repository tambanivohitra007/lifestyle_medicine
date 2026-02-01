import { useEffect, useState } from 'react';
import { Plus, Search, BookMarked, Edit, Trash2, ExternalLink, Download, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints, getApiBaseUrl } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import SlideOver from '../../components/shared/SlideOver';

const References = () => {
  const { t } = useTranslation(['references', 'common']);
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
    const confirmed = await confirmDelete(citation ? `"${citation.substring(0, 50)}..."` : t('references:singular'));
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.referencesAdmin}/${id}`);
      toast.success(t('references:toast.deleted'));
      fetchReferences();
    } catch (error) {
      console.error('Error deleting reference:', error);
      toast.error(t('references:toast.deleteError'));
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
      toast.error(t('references:toast.loadError'));
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
      newErrors.citation = t('references:validation.citationRequired');
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
        toast.success(t('references:toast.updated'));
      } else {
        await api.post(apiEndpoints.referencesAdmin, payload);
        toast.success(t('references:toast.created'));
      }
      closeModal();
      fetchReferences();
    } catch (error) {
      console.error('Error saving reference:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(t('references:toast.updateError'));
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('references:list.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t('references:list.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <a
            href={`${getApiBaseUrl()}/api/v1${apiEndpoints.exportReferencesCsv}`}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('references:list.exportCsv')}
          </a>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('references:list.addNew')}
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
              placeholder={t('references:list.searchPlaceholder')}
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
            <option value="">{t('references:list.allYears')}</option>
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
            {t('references:empty.title')}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {t('references:empty.description')}
          </p>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('references:empty.action')}
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
                          {t('references:labels.link')}
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
                        title={t('common:buttons.edit')}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(reference.id, reference.citation)}
                        className="action-btn hover:bg-red-50 active:bg-red-100"
                        title={t('common:buttons.delete')}
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
        title={editingId ? t('references:form.editTitle') : t('references:form.createTitle')}
        subtitle={editingId ? t('references:form.editSubtitle') : t('references:form.createSubtitle')}
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
                {t('references:form.citation')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="citation"
                name="citation"
                value={formData.citation}
                onChange={handleChange}
                rows={3}
                className={`input-field resize-y ${errors.citation ? 'border-red-500' : ''}`}
                placeholder={t('references:form.citationPlaceholder')}
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
                {t('references:form.year')}
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="input-field"
                placeholder={t('references:form.yearPlaceholder')}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            {/* DOI */}
            <div>
              <label htmlFor="doi" className="label">
                {t('references:form.doi')}
              </label>
              <input
                type="text"
                id="doi"
                name="doi"
                value={formData.doi}
                onChange={handleChange}
                className="input-field"
                placeholder={t('references:form.doiPlaceholder')}
              />
            </div>

            {/* PMID */}
            <div>
              <label htmlFor="pmid" className="label">
                {t('references:form.pmid')}
              </label>
              <input
                type="text"
                id="pmid"
                name="pmid"
                value={formData.pmid}
                onChange={handleChange}
                className="input-field"
                placeholder={t('references:form.pmidPlaceholder')}
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="label">
                {t('references:form.url')}
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="input-field"
                placeholder={t('references:form.urlPlaceholder')}
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
                {saving ? t('common:buttons.saving') : t('references:form.saveReference')}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="btn-outline w-full sm:w-auto"
              >
                {t('common:buttons.cancel')}
              </button>
            </div>
          </form>
        )}
      </SlideOver>
    </div>
  );
};

export default References;
