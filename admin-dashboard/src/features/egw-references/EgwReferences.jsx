import { useEffect, useState } from 'react';
import { Plus, Search, BookMarked, Edit, Trash2, Filter, Save, Loader2, HelpCircle } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import { SkeletonList } from '../../components/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import SlideOver from '../../components/shared/SlideOver';

const COMMON_BOOKS = [
  { abbr: 'MH', name: 'Ministry of Healing' },
  { abbr: 'CD', name: 'Counsels on Diet and Foods' },
  { abbr: 'CH', name: 'Counsels on Health' },
  { abbr: 'MM', name: 'Medical Ministry' },
  { abbr: 'Te', name: 'Temperance' },
  { abbr: 'Ed', name: 'Education' },
  { abbr: 'CG', name: 'Child Guidance' },
  { abbr: 'AH', name: 'Adventist Home' },
  { abbr: 'SC', name: 'Steps to Christ' },
  { abbr: 'DA', name: 'Desire of Ages' },
  { abbr: 'GC', name: 'Great Controversy' },
  { abbr: 'PP', name: 'Patriarchs and Prophets' },
  { abbr: 'COL', name: "Christ's Object Lessons" },
  { abbr: 'MB', name: 'Thoughts from the Mount of Blessing' },
];

const COMMON_TOPICS = [
  'Diet & Nutrition',
  'Exercise & Physical Activity',
  'Rest & Sleep',
  'Water & Hydration',
  'Fresh Air & Sunlight',
  'Temperance',
  'Trust in God',
  'Mental Health',
  'Natural Remedies',
  'Disease Prevention',
  'Healing',
  'Health Reform',
];

const EgwReferences = () => {
  const { canEdit } = useAuth();
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [books, setBooks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    book: '',
    book_abbreviation: '',
    chapter: '',
    page_start: '',
    page_end: '',
    paragraph: '',
    quote: '',
    topic: '',
    context: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAbbreviations, setShowAbbreviations] = useState(false);

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

  // Modal functions
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      book: '',
      book_abbreviation: '',
      chapter: '',
      page_start: '',
      page_end: '',
      paragraph: '',
      quote: '',
      topic: '',
      context: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setEditingId(id);
    setErrors({});
    setIsModalOpen(true);
    setFormLoading(true);

    try {
      const response = await api.get(`${apiEndpoints.egwReferences}/${id}`);
      const ref = response.data.data;
      setFormData({
        book: ref.book || '',
        book_abbreviation: ref.book_abbreviation || '',
        chapter: ref.chapter || '',
        page_start: ref.page_start || '',
        page_end: ref.page_end || '',
        paragraph: ref.paragraph || '',
        quote: ref.quote || '',
        topic: ref.topic || '',
        context: ref.context || '',
      });
    } catch (error) {
      console.error('Error fetching reference:', error);
      toast.error('Failed to load reference');
      setIsModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      book: '',
      book_abbreviation: '',
      chapter: '',
      page_start: '',
      page_end: '',
      paragraph: '',
      quote: '',
      topic: '',
      context: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.book.trim()) newErrors.book = 'Book is required';
    if (!formData.quote.trim()) newErrors.quote = 'Quote is required';
    if (formData.page_end && formData.page_start && parseInt(formData.page_end) < parseInt(formData.page_start)) {
      newErrors.page_end = 'End page must be greater than start page';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        page_start: formData.page_start ? parseInt(formData.page_start) : null,
        page_end: formData.page_end ? parseInt(formData.page_end) : null,
      };

      if (editingId) {
        await api.put(`${apiEndpoints.egwReferencesAdmin}/${editingId}`, payload);
        toast.success('Reference updated');
      } else {
        await api.post(apiEndpoints.egwReferencesAdmin, payload);
        toast.success('Reference created');
      }
      closeModal();
      fetchReferences();
    } catch (error) {
      console.error('Error saving reference:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Failed to save reference');
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

  const handleBookSelect = (book) => {
    setFormData((prev) => ({
      ...prev,
      book: book.name,
      book_abbreviation: book.abbr,
    }));
  };

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
            onClick={openCreateModal}
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
              onClick={openCreateModal}
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
                      onClick={() => openEditModal(reference.id)}
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

      {/* SlideOver Modal for Create/Edit */}
      <SlideOver
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit EGW Reference' : 'New EGW Reference'}
        subtitle={editingId ? 'Update the reference details' : 'Add a new Ellen G. White reference'}
        size="lg"
      >
        {formLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Source Information</h3>

              {/* Quick Book Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Quick Select Book
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAbbreviations(!showAbbreviations)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    {showAbbreviations ? 'Hide' : 'Show'} abbreviations
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_BOOKS.map((book) => (
                    <button
                      key={book.abbr}
                      type="button"
                      onClick={() => handleBookSelect(book)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        formData.book === book.name
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                      title={book.name}
                    >
                      {showAbbreviations ? book.abbr : book.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Book Name */}
                <div>
                  <label htmlFor="book" className="label">
                    Book Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="book"
                    name="book"
                    value={formData.book}
                    onChange={handleChange}
                    className={`input-field ${errors.book ? 'border-red-500' : ''}`}
                    placeholder="e.g., Ministry of Healing"
                  />
                  {errors.book && (
                    <p className="mt-1 text-sm text-red-500">
                      {Array.isArray(errors.book) ? errors.book[0] : errors.book}
                    </p>
                  )}
                </div>

                {/* Abbreviation */}
                <div>
                  <label htmlFor="book_abbreviation" className="label">
                    Book Abbreviation
                  </label>
                  <input
                    type="text"
                    id="book_abbreviation"
                    name="book_abbreviation"
                    value={formData.book_abbreviation}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., MH"
                  />
                </div>

                {/* Chapter */}
                <div>
                  <label htmlFor="chapter" className="label">
                    Chapter
                  </label>
                  <input
                    type="text"
                    id="chapter"
                    name="chapter"
                    value={formData.chapter}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Chapter 1 or 'The True Remedies'"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label htmlFor="topic" className="label">
                    Topic
                  </label>
                  <input
                    type="text"
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Diet & Nutrition"
                    list="topics"
                  />
                  <datalist id="topics">
                    {COMMON_TOPICS.map((topic) => (
                      <option key={topic} value={topic} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Page References */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="page_start" className="label">
                    Page Start
                  </label>
                  <input
                    type="number"
                    id="page_start"
                    name="page_start"
                    value={formData.page_start}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="127"
                    min="1"
                  />
                </div>
                <div>
                  <label htmlFor="page_end" className="label">
                    Page End
                  </label>
                  <input
                    type="number"
                    id="page_end"
                    name="page_end"
                    value={formData.page_end}
                    onChange={handleChange}
                    className={`input-field ${errors.page_end ? 'border-red-500' : ''}`}
                    placeholder="130"
                    min="1"
                  />
                  {errors.page_end && (
                    <p className="mt-1 text-sm text-red-500">
                      {Array.isArray(errors.page_end) ? errors.page_end[0] : errors.page_end}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="paragraph" className="label">
                    Paragraph
                  </label>
                  <input
                    type="text"
                    id="paragraph"
                    name="paragraph"
                    value={formData.paragraph}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="2"
                  />
                </div>
              </div>
            </div>

            {/* Quote Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quote Content</h3>

              <div>
                <label htmlFor="quote" className="label">
                  Quote <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="quote"
                  name="quote"
                  value={formData.quote}
                  onChange={handleChange}
                  rows={5}
                  className={`input-field resize-y ${errors.quote ? 'border-red-500' : ''}`}
                  placeholder="Enter the quote from Ellen G. White's writings..."
                />
                {errors.quote && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.quote) ? errors.quote[0] : errors.quote}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="context" className="label">
                  Context / Notes
                </label>
                <textarea
                  id="context"
                  name="context"
                  value={formData.context}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-y"
                  placeholder="Additional context or application notes..."
                />
              </div>
            </div>

            {/* Preview */}
            {formData.book && formData.quote && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-700 mb-2">Preview</h3>
                <p className="text-gray-800 italic">"{formData.quote}"</p>
                <p className="text-purple-600 text-sm mt-2 font-medium">
                  — {formData.book_abbreviation || formData.book}
                  {formData.chapter && `, ${formData.chapter}`}
                  {formData.page_start && (
                    formData.book_abbreviation
                      ? ` ${formData.page_start}${formData.page_end && formData.page_end !== formData.page_start ? `-${formData.page_end}` : ''}${formData.paragraph ? `.${formData.paragraph}` : ''}`
                      : `, ${formData.page_end && formData.page_end !== formData.page_start ? `pp. ${formData.page_start}-${formData.page_end}` : `p. ${formData.page_start}`}`
                  )}
                </p>
              </div>
            )}

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
                {saving ? 'Saving...' : 'Save Reference'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="btn-outline w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </SlideOver>
    </div>
  );
};

export default EgwReferences;
