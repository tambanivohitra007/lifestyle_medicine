import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, HelpCircle } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast } from '../lib/swal';
import Breadcrumbs from '../components/Breadcrumbs';
import AiSuggestions from '../components/AiSuggestions';

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

const EgwReferenceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showAbbreviations, setShowAbbreviations] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchReference();
    }
  }, [id]);

  const fetchReference = async () => {
    try {
      setLoading(true);
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
      navigate('/egw-references');
    } finally {
      setLoading(false);
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

  const handleAiSuggestionSelect = (suggestion) => {
    setFormData({
      book: suggestion.book || '',
      book_abbreviation: suggestion.book_abbreviation || '',
      chapter: suggestion.chapter || '',
      page_start: suggestion.page_start || '',
      page_end: suggestion.page_end || '',
      paragraph: suggestion.paragraph || '',
      quote: suggestion.quote || '',
      topic: suggestion.topic || '',
      context: suggestion.context || '',
    });
    toast.success('Suggestion applied to form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.book.trim()) newErrors.book = 'Book is required';
    if (!formData.quote.trim()) newErrors.quote = 'Quote is required';
    if (formData.page_end && formData.page_start && parseInt(formData.page_end) < parseInt(formData.page_start)) {
      newErrors.page_end = 'End page must be greater than start page';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const payload = {
        ...formData,
        page_start: formData.page_start ? parseInt(formData.page_start) : null,
        page_end: formData.page_end ? parseInt(formData.page_end) : null,
      };

      if (isEditing) {
        await api.put(`${apiEndpoints.egwReferencesAdmin}/${id}`, payload);
        toast.success('Reference updated');
      } else {
        await api.post(apiEndpoints.egwReferencesAdmin, payload);
        toast.success('Reference created');
      }

      navigate('/egw-references');
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

  const breadcrumbItems = [
    { label: 'EGW References', path: '/egw-references' },
    { label: isEditing ? 'Edit Reference' : 'New Reference' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/egw-references')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit EGW Reference' : 'New EGW Reference'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {isEditing ? 'Update the reference details' : 'Add a new Ellen G. White reference'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Book Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Source Information</h2>

            {/* Quick Book Selection */}
            <div className="mb-4">
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
                <label htmlFor="book" className="block text-sm font-medium text-gray-700 mb-1">
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
                {errors.book && <p className="mt-1 text-sm text-red-500">{errors.book}</p>}
              </div>

              {/* Abbreviation */}
              <div>
                <label htmlFor="book_abbreviation" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="chapter" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="page_start" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="page_end" className="block text-sm font-medium text-gray-700 mb-1">
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
                {errors.page_end && <p className="mt-1 text-sm text-red-500">{errors.page_end}</p>}
              </div>
              <div>
                <label htmlFor="paragraph" className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Quote */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Content</h2>

            <div>
              <label htmlFor="quote" className="block text-sm font-medium text-gray-700 mb-1">
                Quote <span className="text-red-500">*</span>
              </label>
              <textarea
                id="quote"
                name="quote"
                value={formData.quote}
                onChange={handleChange}
                rows={6}
                className={`input-field ${errors.quote ? 'border-red-500' : ''}`}
                placeholder="Enter the quote from Ellen G. White's writings..."
              />
              {errors.quote && <p className="mt-1 text-sm text-red-500">{errors.quote}</p>}
            </div>

            <div className="mt-4">
              <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
                Context / Notes
              </label>
              <textarea
                id="context"
                name="context"
                value={formData.context}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Additional context or application notes..."
              />
            </div>
          </div>

          {/* Preview */}
          {formData.book && formData.quote && (
            <div className="card bg-purple-50 border-purple-200">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Update Reference' : 'Create Reference'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/egw-references')}
              className="btn-secondary order-2 sm:order-1"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* AI Suggestions */}
        {!isEditing && (
          <div className="space-y-4">
            <div>
              <label htmlFor="aiTopic" className="label">
                Search Topic for AI Suggestions
              </label>
              <input
                type="text"
                id="aiTopic"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="input-field"
                placeholder="e.g., diet, exercise, rest, natural remedies..."
              />
            </div>
            <AiSuggestions
              type="egw"
              topic={aiTopic}
              onSelect={handleAiSuggestionSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EgwReferenceForm;
