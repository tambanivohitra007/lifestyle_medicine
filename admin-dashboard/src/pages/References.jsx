import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, BookMarked, Edit, Trash2, ExternalLink } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import Pagination from '../components/Pagination';

const References = () => {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });

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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reference?')) return;

    try {
      await api.delete(`${apiEndpoints.referencesAdmin}/${id}`);
      fetchReferences();
    } catch (error) {
      console.error('Error deleting reference:', error);
      alert('Failed to delete reference');
    }
  };

  const years = [...new Set(references.map((r) => r.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">References</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage citations and scientific references
          </p>
        </div>
        <Link to="/references/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Reference
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by citation, DOI, or PMID..."
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
            <option value="">All Years</option>
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
            No references found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Get started by adding scientific references.
          </p>
          <Link to="/references/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Reference
          </Link>
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
                          Link
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 self-end sm:self-start">
                    <Link
                      to={`/references/${reference.id}/edit`}
                      className="action-btn"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(reference.id)}
                      className="action-btn hover:bg-red-50 active:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
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
    </div>
  );
};

export default References;
