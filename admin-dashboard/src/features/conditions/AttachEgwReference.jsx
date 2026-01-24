import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, BookMarked, Plus, ArrowLeft, Check } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const AttachEgwReference = () => {
  const { id: conditionId } = useParams();
  const navigate = useNavigate();

  const [condition, setCondition] = useState(null);
  const [references, setReferences] = useState([]);
  const [attachedIds, setAttachedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [attaching, setAttaching] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchData();
  }, [conditionId]);

  useEffect(() => {
    fetchReferences();
  }, [searchTerm, bookFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conditionRes, attachedRes, booksRes] = await Promise.all([
        api.get(`${apiEndpoints.conditions}/${conditionId}`),
        api.get(apiEndpoints.conditionEgwReferences(conditionId)),
        api.get(apiEndpoints.egwReferencesBooks),
      ]);

      setCondition(conditionRes.data.data);
      setAttachedIds(new Set((attachedRes.data.data || []).map((r) => r.id)));
      setBooks(booksRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      navigate(`/conditions/${conditionId}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferences = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (bookFilter) params.append('book', bookFilter);

      const response = await api.get(`${apiEndpoints.egwReferences}?${params.toString()}`);
      setReferences(response.data.data || []);
    } catch (error) {
      console.error('Error fetching references:', error);
    }
  };

  const handleAttach = async (reference) => {
    try {
      setAttaching(reference.id);
      await api.post(apiEndpoints.attachConditionEgwReference(conditionId, reference.id));
      setAttachedIds((prev) => new Set([...prev, reference.id]));
      toast.success('EGW reference attached');
    } catch (error) {
      console.error('Error attaching reference:', error);
      toast.error('Failed to attach reference');
    } finally {
      setAttaching(null);
    }
  };

  const handleDetach = async (reference) => {
    try {
      setAttaching(reference.id);
      await api.delete(apiEndpoints.attachConditionEgwReference(conditionId, reference.id));
      setAttachedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reference.id);
        return newSet;
      });
      toast.success('EGW reference removed');
    } catch (error) {
      console.error('Error detaching reference:', error);
      toast.error('Failed to remove reference');
    } finally {
      setAttaching(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Conditions', path: '/conditions' },
    { label: condition?.name || 'Condition', path: `/conditions/${conditionId}` },
    { label: 'Attach EGW Reference' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/conditions/${conditionId}`)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Attach EGW Reference
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Link Ellen G. White references to "{condition?.name}"
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
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
        </div>
      </div>

      {/* References List */}
      {references.length === 0 ? (
        <div className="card text-center py-8">
          <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No EGW references found</p>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search or{' '}
            <button
              onClick={() => navigate('/egw-references/new')}
              className="text-primary-600 hover:underline"
            >
              create a new reference
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {references.map((reference) => {
            const isAttached = attachedIds.has(reference.id);
            const isProcessing = attaching === reference.id;

            return (
              <div
                key={reference.id}
                className={`card transition-colors ${
                  isAttached ? 'bg-purple-50 border-purple-200' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {reference.citation}
                      </h3>
                      {reference.topic && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {reference.topic}
                        </span>
                      )}
                      {isAttached && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Linked
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm italic line-clamp-2">
                      "{reference.quote}"
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      isAttached ? handleDetach(reference) : handleAttach(reference)
                    }
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
                      isAttached
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    } ${isProcessing ? 'opacity-50' : ''}`}
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isAttached ? (
                      'Remove'
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Attach
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Done Button */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/conditions/${conditionId}`)}
          className="btn-primary"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default AttachEgwReference;
