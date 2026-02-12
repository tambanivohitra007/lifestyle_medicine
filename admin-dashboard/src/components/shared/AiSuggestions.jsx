import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Plus, AlertCircle, ExternalLink } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';

const AiSuggestions = ({ type, topic, context, onSelect }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSuggestions = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic to get suggestions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = type === 'scripture'
        ? apiEndpoints.aiSuggestScriptures
        : apiEndpoints.aiSuggestEgwReferences;

      const response = await api.post(endpoint, {
        topic: topic.trim(),
        context: context?.trim() || '',
      });

      if (response.data.error) {
        setError(response.data.error);
        setSuggestions([]);
      } else {
        setSuggestions(response.data.suggestions || []);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
      setError(err.response?.data?.error || 'Failed to get suggestions. Please try again.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    onSelect(suggestion);
  };

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">
            AI Suggestions
          </h3>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            Powered by Gemini
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-purple-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600" />
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-purple-700">
            {type === 'scripture'
              ? 'Get AI-powered Bible verse suggestions related to your topic.'
              : 'Get AI-powered Ellen G. White quotation suggestions sourced from egwwritings.org.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder={`Enter topic (e.g., "${type === 'scripture' ? 'healing, trust, anxiety' : 'diet, exercise, rest'}")...`}
              value={topic}
              readOnly
              className="input-field flex-1 bg-white/70"
            />
            <button
              onClick={fetchSuggestions}
              disabled={loading || !topic.trim()}
              className="btn-primary flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Suggestions
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-purple-800">
                Found {suggestions.length} suggestions:
              </p>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition-colors"
                >
                  {type === 'scripture' ? (
                    // Scripture suggestion
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {suggestion.reference}
                            </h4>
                            {suggestion.theme && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                {suggestion.theme}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm italic mb-2">
                            "{suggestion.text}"
                          </p>
                          {suggestion.explanation && (
                            <p className="text-gray-500 text-xs">
                              {suggestion.explanation}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelect(suggestion)}
                          className="flex-shrink-0 p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                          title="Use this suggestion"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    // EGW suggestion
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {suggestion.book_abbreviation || suggestion.book}
                              {suggestion.page_start && ` ${suggestion.page_start}`}
                            </h4>
                            {suggestion.topic && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {suggestion.topic}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {suggestion.book}
                          </p>
                          <p className="text-gray-600 text-sm italic mb-2">
                            "{suggestion.quote}"
                          </p>
                          {suggestion.context && (
                            <p className="text-gray-500 text-xs">
                              {suggestion.context}
                            </p>
                          )}
                          {suggestion.source_url && (
                            <a
                              href={suggestion.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-800 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Verify on egwwritings.org
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelect(suggestion)}
                          className="flex-shrink-0 p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                          title="Use this suggestion"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasSearched && suggestions.length === 0 && !error && !loading && (
            <p className="text-sm text-purple-600 text-center py-4">
              No suggestions found. Try a different topic.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AiSuggestions;
