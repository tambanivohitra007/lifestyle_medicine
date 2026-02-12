import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookMarked, Edit, Trash2, Filter } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import { SkeletonList } from '../../components/skeleton';
import { useAuth } from '../../contexts/AuthContext';

const EgwReferences = () => {
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [books, setBooks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchReferences();
  }, [searchTerm, bookFilter, topicFilter]);

  const fetchFilters = async () => {
    try {
      const [booksRes, topicsRes] = await Promise.all([
        api.get(apiEndpoints.egwReferencesBooks),
        api.get(apiEndpoints.egwReferencesTopics),
      ]);
      setBooks(booksRes.data.data || []);
      setTopics(topicsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchReferences = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      if (searchTerm) params.append('search', searchTerm);
      if (bookFilter) params.append('book', bookFilter);
      if (topicFilter) params.append('topic', topicFilter);

      const response = await api.get(`${apiEndpoints.egwReferences}?${params.toString()}`);
      setReferences(response.data.data);
      setPagination(response.data.meta || {});
    } catch (error) {
      console.error('Error fetching EGW references:', error);
      toast.error('Failed to load EGW references');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reference) => {
    const confirmed = await confirmDelete(reference.citation || 'this reference');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.egwReferencesAdmin}/${reference.id}`);
      toast.success('Reference deleted');
      fetchReferences();
    } catch (error) {
      console.error('Error deleting reference:', error);
      toast.error('Failed to delete reference');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBookFilter('');
    setTopicFilter('');
  };

  const hasFilters = searchTerm || bookFilter || topicFilter;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">EGW References</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Ellen G. White writings for spiritual health guidance
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate('/egw-references/new')}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Reference
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Book Filter */}
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Books</option>
            {books.map((book) => (
              <option key={book} value={book}>
                {book}
              </option>
            ))}
          </select>

          {/* Topic Filter */}
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-outline flex items-center justify-center gap-2 text-sm"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* References List */}
      {loading ? (
        <SkeletonList items={5} />
      ) : references.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <BookMarked className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {hasFilters ? 'No references found' : 'No EGW references yet'}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            {hasFilters
              ? 'Try adjusting your filters'
              : 'Add Ellen G. White references for spiritual health guidance'}
          </p>
          {!hasFilters && canEdit && (
            <button
              onClick={() => navigate('/egw-references/new')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Reference
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {references.map((reference) => (
            <div key={reference.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {reference.citation}
                    </h3>
                    {reference.topic && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {reference.topic}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm italic line-clamp-3">
                    "{reference.quote}"
                  </p>
                  {reference.context && (
                    <p className="text-gray-500 text-xs mt-2">
                      {reference.context}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-1 self-end sm:self-start flex-shrink-0">
                    <button
                      onClick={() => navigate(`/egw-references/${reference.id}/edit`)}
                      className="action-btn"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(reference)}
                      className="action-btn hover:bg-red-50 active:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm text-gray-700">
                Page {pagination.current_page} of {pagination.last_page}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchReferences(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchReferences(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default EgwReferences;
