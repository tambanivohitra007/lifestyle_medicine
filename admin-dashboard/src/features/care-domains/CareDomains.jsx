import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Layers, Edit, Trash2, Stethoscope } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import { useAuth } from '../../contexts/AuthContext';

const CareDomains = () => {
  const { canEdit } = useAuth();
  const [careDomains, setCareDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    const confirmed = await confirmDelete(name || 'this care domain');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.careDomainsAdmin}/${id}`);
      toast.success('Care domain deleted');
      fetchCareDomains();
    } catch (error) {
      console.error('Error deleting care domain:', error);
      toast.error('Failed to delete care domain. It may have linked interventions.');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Care Domains</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage care domains that categorize interventions
          </p>
        </div>
        {canEdit && (
          <Link to="/care-domains/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Add Care Domain
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search care domains..."
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
            {searchTerm ? 'No care domains found' : 'No care domains yet'}
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {searchTerm
              ? 'Try adjusting your search term'
              : 'Get started by creating your first care domain.'}
          </p>
          {!searchTerm && canEdit && (
            <Link to="/care-domains/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Care Domain
            </Link>
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
                    <Link
                      to={`/care-domains/${domain.id}/edit`}
                      className="action-btn"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(domain.id, domain.name)}
                      className="action-btn hover:bg-red-50 active:bg-red-100"
                      title="Delete"
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
                  <span>{domain.interventions_count} interventions</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareDomains;
