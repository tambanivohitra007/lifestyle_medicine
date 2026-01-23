import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Stethoscope, Edit, Trash2, Eye, Layers } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const Interventions = () => {
  const [interventions, setInterventions] = useState([]);
  const [careDomains, setCareDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchInterventions();
  }, [searchTerm, domainFilter]);

  const fetchData = async () => {
    try {
      const [domainsRes] = await Promise.all([
        api.get(apiEndpoints.careDomains),
      ]);
      setCareDomains(domainsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (domainFilter) params.care_domain_id = domainFilter;

      const response = await api.get(apiEndpoints.interventions, { params });
      setInterventions(response.data.data);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this intervention?')) return;

    try {
      await api.delete(`${apiEndpoints.interventionsAdmin}/${id}`);
      fetchInterventions();
    } catch (error) {
      console.error('Error deleting intervention:', error);
      alert('Failed to delete intervention');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interventions</h1>
          <p className="text-gray-600 mt-1">
            Manage lifestyle interventions and strategies
          </p>
        </div>
        <Link to="/interventions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Intervention
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
        </div>
      </div>

      {/* Interventions Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interventions.map((intervention) => (
            <div
              key={intervention.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/interventions/${intervention.id}`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </Link>
                  <Link
                    to={`/interventions/${intervention.id}/edit`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(intervention.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mb-2">
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

              {intervention.description && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {intervention.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/interventions/${intervention.id}`}
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

export default Interventions;
