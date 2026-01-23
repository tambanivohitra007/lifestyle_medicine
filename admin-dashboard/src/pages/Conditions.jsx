import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Heart, Edit, Trash2, Eye } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const Conditions = () => {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchConditions();
  }, [searchTerm, categoryFilter]);

  const fetchConditions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;

      const response = await api.get(apiEndpoints.conditions, { params });
      setConditions(response.data.data);
    } catch (error) {
      console.error('Error fetching conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this condition?')) return;

    try {
      await api.delete(`${apiEndpoints.conditionsAdmin}/${id}`);
      fetchConditions();
    } catch (error) {
      console.error('Error deleting condition:', error);
      alert('Failed to delete condition');
    }
  };

  const categories = [...new Set(conditions.map((c) => c.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conditions</h1>
          <p className="text-gray-600 mt-1">
            Manage medical conditions and their interventions
          </p>
        </div>
        <Link to="/conditions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Condition
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Conditions Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : conditions.length === 0 ? (
        <div className="card text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No conditions found
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first medical condition.
          </p>
          <Link to="/conditions/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Condition
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary-100">
                  <Heart className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/conditions/${condition.id}`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </Link>
                  <Link
                    to={`/conditions/${condition.id}/edit`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(condition.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {condition.name}
              </h3>

              {condition.category && (
                <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full mb-3">
                  {condition.category}
                </span>
              )}

              {condition.summary && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {condition.summary}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/conditions/${condition.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Conditions;
