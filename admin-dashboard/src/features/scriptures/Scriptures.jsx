import { useEffect, useState } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2, Tag, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Pagination from '../../components/ui/Pagination';
import { SkeletonList } from '../../components/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import SlideOver from '../../components/shared/SlideOver';

const Scriptures = () => {
  const { t } = useTranslation(['scriptures', 'common']);
  const { canEdit } = useAuth();
  const [scriptures, setScriptures] = useState([]);
  const [contentTags, setContentTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ reference: '', text: '', theme: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchContentTags();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, themeFilter, tagFilter]);

  useEffect(() => {
    fetchScriptures();
  }, [searchTerm, themeFilter, tagFilter, currentPage]);

  const fetchContentTags = async () => {
    try {
      const response = await api.get(apiEndpoints.contentTags);
      setContentTags(response.data.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchScriptures = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (searchTerm) params.search = searchTerm;
      if (themeFilter) params.theme = themeFilter;
      if (tagFilter) params.tag_id = tagFilter;

      const response = await api.get(apiEndpoints.scriptures, { params });
      setScriptures(response.data.data);
      setPagination({
        total: response.data.meta?.total || response.data.data.length,
        lastPage: response.data.meta?.last_page || 1,
        perPage: response.data.meta?.per_page || 20,
      });
    } catch (error) {
      console.error('Error fetching scriptures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, reference) => {
    const confirmed = await confirmDelete(reference || t('scriptures:singular'));
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.scripturesAdmin}/${id}`);
      toast.success(t('scriptures:toast.deleted'));
      fetchScriptures();
    } catch (error) {
      console.error('Error deleting scripture:', error);
      toast.error(t('scriptures:toast.deleteError'));
    }
  };

  // Modal functions
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ reference: '', text: '', theme: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setEditingId(id);
    setErrors({});
    setIsModalOpen(true);
    setFormLoading(true);

    try {
      const response = await api.get(`${apiEndpoints.scriptures}/${id}`);
      const scripture = response.data.data;
      setFormData({
        reference: scripture.reference || '',
        text: scripture.text || '',
        theme: scripture.theme || '',
      });
    } catch (error) {
      console.error('Error fetching scripture:', error);
      toast.error(t('scriptures:toast.loadError'));
      setIsModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ reference: '', text: '', theme: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference.trim()) {
      newErrors.reference = t('scriptures:validation.referenceRequired');
    }
    if (!formData.text.trim()) {
      newErrors.text = t('scriptures:validation.textRequired');
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
        await api.put(`${apiEndpoints.scripturesAdmin}/${editingId}`, formData);
        toast.success(t('scriptures:toast.updated'));
      } else {
        await api.post(apiEndpoints.scripturesAdmin, formData);
        toast.success(t('scriptures:toast.created'));
      }
      closeModal();
      fetchScriptures();
    } catch (error) {
      console.error('Error saving scripture:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(t('scriptures:toast.updateError'));
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

  const themes = [...new Set(scriptures.map((s) => s.theme).filter(Boolean))];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('scriptures:list.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t('scriptures:list.subtitle')}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            {t('scriptures:list.addNew')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('scriptures:list.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={themeFilter}
            onChange={(e) => setThemeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{t('scriptures:list.allThemes')}</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{t('scriptures:list.allTags')}</option>
            {contentTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scriptures Grid */}
      {loading ? (
        <SkeletonList items={5} />
      ) : scriptures.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <BookOpen className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('scriptures:empty.title')}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {t('scriptures:empty.description')}
          </p>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('scriptures:empty.action')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {scriptures.map((scripture) => (
              <div
                key={scripture.id}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-600" />
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(scripture.id)}
                        className="action-btn"
                        title={t('common:buttons.edit')}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(scripture.id, scripture.reference)}
                        className="action-btn hover:bg-red-50 active:bg-red-100"
                        title={t('common:buttons.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
                  {scripture.reference}
                </h3>

                {scripture.theme && (
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-3">
                    {scripture.theme}
                  </span>
                )}

                {scripture.tags && scripture.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {scripture.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full"
                      >
                        <Tag className="w-3 h-3" />
                        {tag.name}
                      </span>
                    ))}
                    {scripture.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{scripture.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <p className="text-gray-600 italic text-xs sm:text-sm line-clamp-4">
                  "{scripture.text}"
                </p>
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
        title={editingId ? t('scriptures:form.editTitle') : t('scriptures:form.createTitle')}
        subtitle={editingId ? t('scriptures:form.editSubtitle') : t('scriptures:form.createSubtitle')}
        size="md"
      >
        {formLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reference */}
            <div>
              <label htmlFor="reference" className="label">
                {t('scriptures:form.reference')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className={`input-field ${errors.reference ? 'border-red-500' : ''}`}
                placeholder={t('scriptures:form.referencePlaceholder')}
                autoFocus
              />
              {errors.reference && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.reference) ? errors.reference[0] : errors.reference}
                </p>
              )}
            </div>

            {/* Text */}
            <div>
              <label htmlFor="text" className="label">
                {t('scriptures:form.text')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                rows={5}
                className={`input-field resize-y ${errors.text ? 'border-red-500' : ''}`}
                placeholder={t('scriptures:form.textPlaceholder')}
              />
              {errors.text && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.text) ? errors.text[0] : errors.text}
                </p>
              )}
            </div>

            {/* Theme */}
            <div>
              <label htmlFor="theme" className="label">
                {t('scriptures:form.theme')}
              </label>
              <input
                type="text"
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="input-field"
                placeholder={t('scriptures:form.themePlaceholder')}
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
                {saving ? t('common:buttons.saving') : t('scriptures:form.saveScripture')}
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

export default Scriptures;
