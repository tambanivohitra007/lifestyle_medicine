import { useEffect, useState } from 'react';
import { Plus, Search, ShieldAlert, Edit, Trash2, Eye, Download, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints, getApiBaseUrl } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import { SkeletonCard } from '../../components/skeleton';
import ViewModeToggle from '../../components/ui/ViewModeToggle';
import ConditionTable from './components/ConditionTable';
import ConditionList from './components/ConditionList';
import RichTextPreview from '../../components/shared/RichTextPreview';
import { useAuth } from '../../contexts/AuthContext';
import SlideOver from '../../components/shared/SlideOver';
import ConditionDetailSlideOver from './components/ConditionDetailSlideOver';

const Conditions = () => {
  const { t } = useTranslation(['conditions', 'common']);
  const { canEdit } = useAuth();
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('conditions_view_mode') || 'grid';
  });

  // Modal state for edit form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', summary: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Detail slide-over state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingConditionId, setViewingConditionId] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchConditions();
  }, [searchTerm, categoryFilter, currentPage, sortBy, sortOrder]);

  const fetchConditions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;

      const response = await api.get(apiEndpoints.conditions, { params });
      setConditions(response.data.data);
      setPagination({
        total: response.data.meta?.total || response.data.data.length,
        lastPage: response.data.meta?.last_page || 1,
        perPage: response.data.meta?.per_page || 20,
      });
    } catch (error) {
      console.error('Error fetching conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('conditions_view_mode', mode);
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirmDelete(name || 'this condition');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.conditionsAdmin}/${id}`);
      toast.success(t('conditions:toast.deleted'));
      setIsDetailOpen(false);
      fetchConditions();
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error(t('conditions:toast.deleteError'));
    }
  };

  // Detail slide-over functions
  const openDetailSlideOver = (id) => {
    setViewingConditionId(id);
    setIsDetailOpen(true);
  };

  const closeDetailSlideOver = () => {
    setIsDetailOpen(false);
    setViewingConditionId(null);
  };

  // Modal functions
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', category: '', summary: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setEditingId(id);
    setErrors({});
    setIsModalOpen(true);
    setFormLoading(true);

    try {
      const response = await api.get(`${apiEndpoints.conditions}/${id}`);
      const condition = response.data.data;
      setFormData({
        name: condition.name || '',
        category: condition.category || '',
        summary: condition.summary || '',
      });
    } catch (error) {
      console.error('Error fetching condition:', error);
      toast.error(t('conditions:toast.loadError'));
      setIsModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', category: '', summary: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('common:messages.error.requiredField');
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
        await api.put(`${apiEndpoints.conditionsAdmin}/${editingId}`, formData);
        toast.success(t('conditions:toast.updated'));
      } else {
        await api.post(apiEndpoints.conditionsAdmin, formData);
        toast.success(t('conditions:toast.created'));
      }
      closeModal();
      fetchConditions();
    } catch (error) {
      console.error('Error saving condition:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(editingId ? t('conditions:toast.updateError') : t('conditions:toast.createError'));
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

  const categories = [...new Set(conditions.map((c) => c.category).filter(Boolean))];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('conditions:title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t('conditions:list.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <a
            href={`${getApiBaseUrl()}/api/v1/export/conditions/summary/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('common:buttons.export')}
          </a>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('conditions:list.addNew')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('conditions:list.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{t('conditions:list.allDomains')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort and View Mode Bar */}
      <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200">
        {/* Mobile: Stacked layout */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* View mode toggle and count - top row on mobile */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {pagination.total} {pagination.total === 1 ? t('conditions:singular') : t('conditions:plural')}
            </div>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
          {/* Sort options - scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{t('common:filters.sortBy')}:</span>
            <SortableHeader
              field="name"
              label={t('common:labels.name')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              field="category"
              label={t('common:labels.category')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              field="created_at"
              label={t('common:labels.createdAt')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              field="updated_at"
              label={t('common:labels.updatedAt')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        </div>
        {/* Desktop: Single row layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600 font-medium">{t('common:filters.sortBy')}:</span>
            <SortableHeader
              field="name"
              label={t('common:labels.name')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              field="category"
              label={t('common:labels.category')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              field="created_at"
              label={t('common:labels.createdAt')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              field="updated_at"
              label={t('common:labels.updatedAt')}
              currentSort={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {pagination.total} {pagination.total === 1 ? t('conditions:singular') : t('conditions:plural')}
            </div>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
        </div>
      </div>

      {/* Conditions Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : conditions.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <ShieldAlert className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('conditions:empty.title')}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {t('conditions:empty.description')}
          </p>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('conditions:empty.action')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className="card hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary-100">
                      <ShieldAlert className="w-5 sm:w-6 h-5 sm:h-6 text-primary-600" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openDetailSlideOver(condition.id)}
                        className="action-btn"
                        title={t('common:buttons.viewDetails')}
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEditModal(condition.id)}
                            className="action-btn"
                            title={t('common:buttons.edit')}
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(condition.id, condition.name)}
                            className="action-btn hover:bg-red-50 active:bg-red-100"
                            title={t('common:buttons.delete')}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
                    {condition.name}
                  </h3>

                  {condition.category && (
                    <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full mb-3">
                      {condition.category}
                    </span>
                  )}

                  <RichTextPreview
                    content={condition.summary}
                    maxLines={3}
                    className="text-sm"
                  />

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openDetailSlideOver(condition.id)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 active:text-primary-800"
                    >
                      {t('common:buttons.viewDetails')} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <ConditionList conditions={conditions} onDelete={handleDelete} onEdit={openEditModal} onView={openDetailSlideOver} canEdit={canEdit} />
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <ConditionTable conditions={conditions} onDelete={handleDelete} onEdit={openEditModal} onView={openDetailSlideOver} canEdit={canEdit} />
          )}

          {/* Pagination */}
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
        title={editingId ? t('conditions:form.editTitle') : t('conditions:form.createTitle')}
        subtitle={editingId ? t('conditions:list.subtitle') : t('conditions:list.subtitle')}
        size="md"
      >
        {formLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">
                {t('conditions:form.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder={t('conditions:form.namePlaceholder')}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="label">
                {t('common:labels.category')}
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`input-field ${errors.category ? 'border-red-500' : ''}`}
                placeholder={t('common:labels.category')}
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.category) ? errors.category[0] : errors.category}
                </p>
              )}
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="label">
                {t('conditions:form.summary')}
              </label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows={5}
                className={`input-field resize-y ${errors.summary ? 'border-red-500' : ''}`}
                placeholder={t('conditions:form.summaryPlaceholder')}
              />
              {errors.summary && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.summary) ? errors.summary[0] : errors.summary}
                </p>
              )}
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
                {saving ? t('common:messages.saving') : t('common:buttons.save')}
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

      {/* Detail SlideOver */}
      <ConditionDetailSlideOver
        isOpen={isDetailOpen}
        onClose={closeDetailSlideOver}
        conditionId={viewingConditionId}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Conditions;
