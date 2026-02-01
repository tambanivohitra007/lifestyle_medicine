import { useEffect, useState } from 'react';
import { Plus, Search, Layers, Edit, Trash2, Stethoscope, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import { useAuth } from '../../contexts/AuthContext';
import SlideOver from '../../components/shared/SlideOver';

const CareDomains = () => {
  const { t } = useTranslation(['careDomains', 'common']);
  const { canEdit } = useAuth();
  const [careDomains, setCareDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCareDomains();
  }, []);

  const fetchCareDomains = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoints.careDomains);
      setCareDomains(response.data.data);
    } catch (error) {
      console.error('Error fetching care domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirmDelete(name || t('careDomains:singular'));
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.careDomainsAdmin}/${id}`);
      toast.success(t('careDomains:toast.deleted'));
      fetchCareDomains();
    } catch (error) {
      console.error('Error deleting care domain:', error);
      toast.error(t('careDomains:toast.deleteErrorLinked'));
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setEditingId(id);
    setErrors({});
    setIsModalOpen(true);
    setFormLoading(true);

    try {
      const response = await api.get(`${apiEndpoints.careDomains}/${id}`);
      const domain = response.data.data;
      setFormData({ name: domain.name || '' });
    } catch (error) {
      console.error('Error fetching care domain:', error);
      toast.error(t('careDomains:toast.loadError'));
      setIsModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('careDomains:validation.nameRequired');
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
        await api.put(`${apiEndpoints.careDomainsAdmin}/${editingId}`, formData);
        toast.success(t('careDomains:toast.updated'));
      } else {
        await api.post(apiEndpoints.careDomainsAdmin, formData);
        toast.success(t('careDomains:toast.created'));
      }
      closeModal();
      fetchCareDomains();
    } catch (error) {
      console.error('Error saving care domain:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('careDomains:toast.updateError'));
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

  const filteredDomains = careDomains.filter((domain) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('careDomains:list.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t('careDomains:list.subtitle')}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            {t('careDomains:list.addNew')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('careDomains:list.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Care Domains Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <Layers className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? t('careDomains:empty.title') : t('careDomains:empty.noDomainsYet')}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {searchTerm
              ? t('careDomains:empty.adjustSearch')
              : t('careDomains:empty.description')}
          </p>
          {!searchTerm && canEdit && (
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('careDomains:empty.action')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDomains.map((domain) => (
            <div
              key={domain.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 sm:p-3 rounded-lg bg-secondary-100">
                  <Layers className="w-5 sm:w-6 h-5 sm:h-6 text-secondary-600" />
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(domain.id)}
                      className="action-btn"
                      title={t('common:buttons.edit')}
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(domain.id, domain.name)}
                      className="action-btn hover:bg-red-50 active:bg-red-100"
                      title={t('common:buttons.delete')}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-lg sm:text-xl text-gray-900 mb-2">
                {domain.name}
              </h3>

              {domain.interventions_count !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Stethoscope className="w-4 h-4" />
                  <span>{t('careDomains:detail.interventionsCount', { count: domain.interventions_count })}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SlideOver Modal for Create/Edit */}
      <SlideOver
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? t('careDomains:form.editTitle') : t('careDomains:form.createTitle')}
        subtitle={editingId ? t('careDomains:form.editSubtitle') : t('careDomains:form.createSubtitle')}
        size="sm"
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
                {t('careDomains:form.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder={t('careDomains:form.namePlaceholder')}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.name) ? errors.name[0] : errors.name}
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
                {saving ? t('common:buttons.saving') : t('careDomains:form.saveCareDomain')}
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

export default CareDomains;
