import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Edit, Trash2, Stethoscope, Download, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints, getApiBaseUrl } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import SlideOver from '../../components/shared/SlideOver';

const QUALITY_RATING = {
  A: { labelKey: 'evidence:quality.A', color: 'bg-green-100 text-green-700' },
  B: { labelKey: 'evidence:quality.B', color: 'bg-blue-100 text-blue-700' },
  C: { labelKey: 'evidence:quality.C', color: 'bg-yellow-100 text-yellow-700' },
  D: { labelKey: 'evidence:quality.D', color: 'bg-red-100 text-red-700' },
};

const STUDY_TYPE = {
  rct: 'evidence:studyTypes.rct',
  meta_analysis: 'evidence:studyTypes.meta_analysis',
  systematic_review: 'evidence:studyTypes.systematic_review',
  observational: 'evidence:studyTypes.observational',
  case_series: 'evidence:studyTypes.case_series',
  expert_opinion: 'evidence:studyTypes.expert_opinion',
};

const STUDY_TYPES = [
  { value: 'rct', labelKey: 'evidence:studyTypes.rct_full' },
  { value: 'meta_analysis', labelKey: 'evidence:studyTypes.meta_analysis_full' },
  { value: 'systematic_review', labelKey: 'evidence:studyTypes.systematic_review_full' },
  { value: 'observational', labelKey: 'evidence:studyTypes.observational_full' },
  { value: 'case_series', labelKey: 'evidence:studyTypes.case_series_full' },
  { value: 'expert_opinion', labelKey: 'evidence:studyTypes.expert_opinion_full' },
];

const QUALITY_RATINGS = [
  { value: 'A', labelKey: 'evidence:quality.A_full' },
  { value: 'B', labelKey: 'evidence:quality.B_full' },
  { value: 'C', labelKey: 'evidence:quality.C_full' },
  { value: 'D', labelKey: 'evidence:quality.D_full' },
];

const Evidence = () => {
  const { t } = useTranslation(['evidence', 'common']);
  const { canEdit } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studyTypeFilter, setStudyTypeFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    intervention_id: '',
    study_type: '',
    population: '',
    quality_rating: '',
    summary: '',
    notes: '',
  });
  const [interventions, setInterventions] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, studyTypeFilter, qualityFilter]);

  useEffect(() => {
    fetchEntries();
  }, [searchTerm, studyTypeFilter, qualityFilter, currentPage]);

  useEffect(() => {
    fetchInterventions();
  }, []);

  const fetchInterventions = async () => {
    try {
      const response = await api.get(apiEndpoints.interventions);
      setInterventions(response.data.data);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (searchTerm) params.search = searchTerm;
      if (studyTypeFilter) params.study_type = studyTypeFilter;
      if (qualityFilter) params.quality_rating = qualityFilter;

      const response = await api.get(apiEndpoints.evidenceEntries, { params });
      setEntries(response.data.data);
      setPagination({
        total: response.data.meta?.total || response.data.data.length,
        lastPage: response.data.meta?.last_page || 1,
        perPage: response.data.meta?.per_page || 20,
      });
    } catch (error) {
      console.error('Error fetching evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, summary) => {
    const confirmed = await confirmDelete(summary ? `"${summary.substring(0, 50)}..."` : t('evidence:singular'));
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.evidenceEntriesAdmin}/${id}`);
      toast.success(t('evidence:toast.deleted'));
      fetchEntries();
    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast.error(t('evidence:toast.deleteError'));
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      intervention_id: '',
      study_type: '',
      population: '',
      quality_rating: '',
      summary: '',
      notes: '',
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
      toast.error(t('evidence:toast.loadError'));
      setIsModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      intervention_id: '',
      study_type: '',
      population: '',
      quality_rating: '',
      summary: '',
      notes: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.intervention_id) {
      newErrors.intervention_id = t('evidence:validation.interventionRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`${apiEndpoints.evidenceEntriesAdmin}/${editingId}`, formData);
        toast.success(t('evidence:toast.updated'));
      } else {
        await api.post(apiEndpoints.evidenceEntriesAdmin, formData);
        toast.success(t('evidence:toast.created'));
      }
      closeModal();
      fetchEntries();
    } catch (error) {
      console.error('Error saving evidence:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(t('evidence:toast.updateError'));
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('evidence:list.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t('evidence:list.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <a
            href={`${getApiBaseUrl()}/api/v1${apiEndpoints.exportEvidenceCsv}`}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('evidence:list.exportCsv')}
          </a>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('evidence:list.addNew')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('evidence:list.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={studyTypeFilter}
            onChange={(e) => setStudyTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{t('evidence:list.allStudyTypes')}</option>
            {Object.entries(STUDY_TYPE).map(([key, labelKey]) => (
              <option key={key} value={key}>
                {t(labelKey)}
              </option>
            ))}
          </select>
          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{t('evidence:list.allQualityRatings')}</option>
            {Object.entries(QUALITY_RATING).map(([key, { labelKey }]) => (
              <option key={key} value={key}>
                {t(labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Evidence List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('evidence:empty.title')}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {t('evidence:empty.description')}
          </p>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('evidence:empty.action')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {entry.quality_rating && QUALITY_RATING[entry.quality_rating] && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            QUALITY_RATING[entry.quality_rating]?.color
                          }`}
                        >
                          {t(QUALITY_RATING[entry.quality_rating]?.labelKey)}
                        </span>
                      )}
                      {entry.study_type && STUDY_TYPE[entry.study_type] && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {t(STUDY_TYPE[entry.study_type])}
                        </span>
                      )}
                    </div>

                    {entry.intervention && (
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <Link
                          to={`/interventions/${entry.intervention.id}`}
                          className="text-sm font-medium text-green-600 hover:underline"
                        >
                          {entry.intervention.name}
                        </Link>
                      </div>
                    )}

                    {entry.summary && (
                      <p className="text-gray-700 mb-2 text-sm sm:text-base">{entry.summary}</p>
                    )}

                    {entry.population && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        <span className="font-medium">{t('evidence:labels.population')}:</span> {entry.population}
                      </p>
                    )}

                    {entry.references && entry.references.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {t('evidence:labels.referencesCount', { count: entry.references.length })}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex gap-1 self-end sm:self-start">
                      <button
                        onClick={() => openEditModal(entry.id)}
                        className="action-btn"
                        title={t('common:buttons.edit')}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id, entry.summary)}
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
        title={editingId ? t('evidence:form.editTitle') : t('evidence:form.createTitle')}
        subtitle={editingId ? t('evidence:form.editSubtitle') : t('evidence:form.createSubtitle')}
        size="lg"
      >
        {formLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Intervention */}
            <div>
              <label htmlFor="intervention_id" className="label">
                {t('evidence:form.intervention')} <span className="text-red-500">*</span>
              </label>
              <select
                id="intervention_id"
                name="intervention_id"
                value={formData.intervention_id}
                onChange={handleChange}
                className={`input-field ${errors.intervention_id ? 'border-red-500' : ''}`}
              >
                <option value="">{t('evidence:form.selectIntervention')}</option>
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
                  {t('evidence:form.studyType')}
                </label>
                <select
                  id="study_type"
                  name="study_type"
                  value={formData.study_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">{t('evidence:form.selectStudyType')}</option>
                  {STUDY_TYPES.map(({ value, labelKey }) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quality_rating" className="label">
                  {t('evidence:form.qualityRating')}
                </label>
                <select
                  id="quality_rating"
                  name="quality_rating"
                  value={formData.quality_rating}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">{t('evidence:form.selectQualityRating')}</option>
                  {QUALITY_RATINGS.map(({ value, labelKey }) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Population */}
            <div>
              <label htmlFor="population" className="label">
                {t('evidence:form.population')}
              </label>
              <input
                type="text"
                id="population"
                name="population"
                value={formData.population}
                onChange={handleChange}
                className="input-field"
                placeholder={t('evidence:form.populationPlaceholder')}
              />
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="label">
                {t('evidence:form.summary')}
              </label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows={4}
                className="input-field resize-y"
                placeholder={t('evidence:form.summaryPlaceholder')}
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="label">
                {t('evidence:form.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-field resize-y"
                placeholder={t('evidence:form.notesPlaceholder')}
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
                {saving ? t('common:buttons.saving') : t('evidence:form.saveEvidence')}
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

export default Evidence;
