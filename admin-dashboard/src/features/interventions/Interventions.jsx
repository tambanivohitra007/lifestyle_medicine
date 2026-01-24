import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Stethoscope, Edit, Trash2, Eye, Layers, Tag } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Pagination from '../../components/ui/Pagination';
import { SkeletonCard } from '../../components/skeleton';
import ViewModeToggle from '../../components/ui/ViewModeToggle';
import InterventionTable from './components/InterventionTable';
import InterventionList from './components/InterventionList';
import RichTextPreview from '../../components/shared/RichTextPreview';

const Interventions = () => {
  const [interventions, setInterventions] = useState([]);
  const [careDomains, setCareDomains] = useState([]);
  const [contentTags, setContentTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('interventions_view_mode') || 'grid';
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, domainFilter, tagFilter]);

  useEffect(() => {
    fetchInterventions();
  }, [searchTerm, domainFilter, tagFilter, currentPage]);

  const fetchData = async () => {
    try {
      const [domainsRes, tagsRes] = await Promise.all([
        api.get(apiEndpoints.careDomains),
        api.get(apiEndpoints.contentTags),
      ]);
      setCareDomains(domainsRes.data.data);
      setContentTags(tagsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (searchTerm) params.search = searchTerm;
      if (domainFilter) params.care_domain_id = domainFilter;
      if (tagFilter) params.tag_id = tagFilter;

      const response = await api.get(apiEndpoints.interventions, { params });
      setInterventions(response.data.data);
      setPagination({
        total: response.data.meta?.total || response.data.data.length,
        lastPage: response.data.meta?.last_page || 1,
        perPage: response.data.meta?.per_page || 20,
      });
    } catch (error) {
      console.error('Error fetching interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirmDelete(name || 'this intervention');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.interventionsAdmin}/${id}`);
      toast.success('Intervention deleted');
      fetchInterventions();
    } catch (error) {
      console.error('Error deleting intervention:', error);
      toast.error('Failed to delete intervention');
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('interventions_view_mode', mode);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Interventions</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage lifestyle interventions and strategies
          </p>
        </div>
        <Link to="/interventions/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Intervention
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search interventions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Care Domain Filter */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Care Domains</option>
            {careDomains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Tags</option>
            {contentTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Mode Toggle Bar */}
      <div className="flex items-center justify-between gap-3 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200">
        <div className="text-xs sm:text-sm text-gray-500">
          {pagination.total} {pagination.total === 1 ? 'intervention' : 'interventions'}
        </div>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </div>

      {/* Interventions Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : interventions.length === 0 ? (
        <div className="card text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No interventions found
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first intervention.
          </p>
          <Link to="/interventions/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Intervention
          </Link>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {interventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="card hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Stethoscope className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
                    </div>
                    <div className="flex gap-1">
                      <Link
                        to={`/interventions/${intervention.id}`}
                        className="action-btn"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </Link>
                      <Link
                        to={`/interventions/${intervention.id}/edit`}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(intervention.id, intervention.name)}
                        className="action-btn hover:bg-red-50 active:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
                    {intervention.name}
                  </h3>

                  {intervention.care_domain && (
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-secondary-500" />
                      <span className="text-sm text-secondary-600 font-medium">
                        {intervention.care_domain.name}
                      </span>
                    </div>
                  )}

                  {intervention.tags && intervention.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {intervention.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                      {intervention.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{intervention.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <RichTextPreview
                    content={intervention.description}
                    maxLines={3}
                    className="text-sm"
                  />

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/interventions/${intervention.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 active:text-primary-800"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <InterventionList interventions={interventions} onDelete={handleDelete} />
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <InterventionTable interventions={interventions} onDelete={handleDelete} />
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
    </div>
  );
};

export default Interventions;
