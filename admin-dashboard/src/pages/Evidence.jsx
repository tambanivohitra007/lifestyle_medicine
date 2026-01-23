import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Edit, Trash2, Stethoscope } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast, confirmDelete } from '../lib/swal';
import Pagination from '../components/Pagination';

const QUALITY_RATING = {
  A: { label: 'A - High', color: 'bg-green-100 text-green-700' },
  B: { label: 'B - Good', color: 'bg-blue-100 text-blue-700' },
  C: { label: 'C - Moderate', color: 'bg-yellow-100 text-yellow-700' },
  D: { label: 'D - Low', color: 'bg-red-100 text-red-700' },
};

const STUDY_TYPE = {
  rct: 'RCT',
  meta_analysis: 'Meta-Analysis',
  systematic_review: 'Systematic Review',
  observational: 'Observational',
  case_series: 'Case Series',
  expert_opinion: 'Expert Opinion',
};

const Evidence = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studyTypeFilter, setStudyTypeFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, studyTypeFilter, qualityFilter]);

  useEffect(() => {
    fetchEntries();
  }, [searchTerm, studyTypeFilter, qualityFilter, currentPage]);

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
    const confirmed = await confirmDelete(summary ? `"${summary.substring(0, 50)}..."` : 'this evidence entry');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.evidenceEntriesAdmin}/${id}`);
      toast.success('Evidence entry deleted');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast.error('Failed to delete evidence entry');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Evidence Entries</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage evidence supporting interventions
          </p>
        </div>
        <Link to="/evidence/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Evidence
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search evidence..."
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
            <option value="">All Study Types</option>
            {Object.entries(STUDY_TYPE).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Quality Ratings</option>
            {Object.entries(QUALITY_RATING).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
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
            No evidence entries found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Get started by adding evidence for interventions.
          </p>
          <Link to="/evidence/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Evidence
          </Link>
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
                      {entry.quality_rating && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            QUALITY_RATING[entry.quality_rating]?.color
                          }`}
                        >
                          {QUALITY_RATING[entry.quality_rating]?.label}
                        </span>
                      )}
                      {entry.study_type && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {STUDY_TYPE[entry.study_type]}
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
                        <span className="font-medium">Population:</span> {entry.population}
                      </p>
                    )}

                    {entry.references && entry.references.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {entry.references.length} reference(s)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 self-end sm:self-start">
                    <Link
                      to={`/evidence/${entry.id}/edit`}
                      className="action-btn"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(entry.id, entry.summary)}
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

export default Evidence;
