import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Heart, Edit, Trash2, Eye, Download } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast, confirmDelete } from '../lib/swal';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import { SkeletonCard } from '../components/Skeleton';
import ViewModeToggle from '../components/ViewModeToggle';
import ConditionTable from '../components/views/ConditionTable';
import ConditionList from '../components/views/ConditionList';
import RichTextPreview from '../components/RichTextPreview';

const Conditions = () => {
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
      toast.success('Condition deleted');
      fetchConditions();
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error('Failed to delete condition');
    }
  };

  const categories = [...new Set(conditions.map((c) => c.category).filter(Boolean))];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Conditions</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage medical conditions and their interventions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <a
            href="http://localhost:8000/api/v1/export/conditions/summary/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Summary
          </a>
          <Link to="/conditions/new" className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Add Condition
          </Link>
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
              placeholder="Search conditions..."
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
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort and View Mode Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Sort by:</span>
          <SortableHeader
            field="name"
            label="Name"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <SortableHeader
            field="category"
            label="Category"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <SortableHeader
            field="created_at"
            label="Date Created"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <SortableHeader
            field="updated_at"
            label="Last Updated"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {pagination.total} {pagination.total === 1 ? 'condition' : 'conditions'}
          </div>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
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
          <Heart className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No conditions found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Get started by creating your first medical condition.
          </p>
          <Link to="/conditions/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Condition
          </Link>
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
                      <Heart className="w-5 sm:w-6 h-5 sm:h-6 text-primary-600" />
                    </div>
                    <div className="flex gap-1">
                      <Link
                        to={`/conditions/${condition.id}`}
                        className="action-btn"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </Link>
                      <Link
                        to={`/conditions/${condition.id}/edit`}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(condition.id, condition.name)}
                        className="action-btn hover:bg-red-50 active:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
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
                    <Link
                      to={`/conditions/${condition.id}`}
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
            <ConditionList conditions={conditions} onDelete={handleDelete} />
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <ConditionTable conditions={conditions} onDelete={handleDelete} />
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

export default Conditions;
