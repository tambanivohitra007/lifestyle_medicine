import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Heart,
  Activity,
  Book,
  BookMarked,
  ChefHat,
  FileText,
  Library,
  X,
  Clock,
  ArrowRight,
  CornerDownLeft,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  Bookmark,
  Layers,
  Tag,
  ClipboardList,
  Waypoints,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';

const ENTITY_TYPES = [
  { key: 'conditions', labelKey: 'search:types.conditions', icon: Heart, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { key: 'interventions', labelKey: 'search:types.interventions', icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { key: 'care_domains', labelKey: 'search:types.careDomains', icon: Bookmark, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { key: 'scriptures', labelKey: 'search:types.scriptures', icon: Book, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'egw_references', labelKey: 'search:types.egwReferences', icon: BookMarked, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { key: 'recipes', labelKey: 'search:types.recipes', icon: ChefHat, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'evidence', labelKey: 'search:types.evidence', icon: FileText, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'references', labelKey: 'search:types.references', icon: Library, color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  { key: 'condition_sections', labelKey: 'search:types.conditionSections', icon: Layers, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { key: 'tags', labelKey: 'search:types.tags', icon: Tag, color: 'text-lime-600', bgColor: 'bg-lime-50', borderColor: 'border-lime-200' },
  { key: 'protocols', labelKey: 'search:types.protocols', icon: ClipboardList, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { key: 'body_systems', labelKey: 'search:types.bodySystems', icon: Waypoints, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
];

const RECENT_SEARCHES_KEY = 'lm_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Highlight matched text
const HighlightedText = ({ text, query }) => {
  if (!query || !text) return <span>{text}</span>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const Search = () => {
  const { t } = useTranslation(['search', 'common']);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(true);

  const debouncedQuery = useDebounce(query, 200);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Perform search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      setSelectedIndex(-1);
      setShowRecent(true);
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        setShowRecent(false);
        const params = { q: debouncedQuery, limit: 25 };
        if (selectedTypes.length > 0) {
          params.types = selectedTypes.join(',');
        }
        const response = await api.get(apiEndpoints.search, { params });
        setResults(response.data);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, selectedTypes]);

  // Get all results as flat array
  const allResults = results ? Object.values(results.results).flat() : [];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const item = allResults[selectedIndex];
        if (item) {
          saveRecentSearch(query);
          navigate(getEntityLink(item.type, item.id, item));
        }
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
        setQuery('');
        setResults(null);
        setShowRecent(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allResults, selectedIndex, navigate, query, saveRecentSearch]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-result-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getEntityLink = (type, id, item) => {
    const routes = {
      condition: `/conditions/${id}`,
      intervention: `/interventions/${id}`,
      scripture: `/scriptures/${id}/edit`,
      egw_reference: `/egw-references/${id}/edit`,
      recipe: `/recipes/${id}`,
      evidence: `/evidence/${id}/edit`,
      reference: `/references/${id}/edit`,
      care_domain: `/care-domains/${id}/edit`,
      condition_section: `/conditions/${item?.condition_id}`,
      tag: `/tags`,
      protocol: `/interventions/${item?.intervention_id}`,
      body_system: `/conditions`,
    };
    return routes[type] || '#';
  };

  const getEntityConfig = (type) => {
    const typeToKey = {
      condition: 'conditions',
      intervention: 'interventions',
      scripture: 'scriptures',
      egw_reference: 'egw_references',
      recipe: 'recipes',
      evidence: 'evidence',
      reference: 'references',
      care_domain: 'care_domains',
      condition_section: 'condition_sections',
      tag: 'tags',
      protocol: 'protocols',
      body_system: 'body_systems',
    };
    return ENTITY_TYPES.find((e) => e.key === typeToKey[type]) || ENTITY_TYPES[0];
  };

  const handleResultClick = (item) => {
    saveRecentSearch(query);
    navigate(getEntityLink(item.type, item.id, item));
  };

  const handleRecentClick = (searchTerm) => {
    setQuery(searchTerm);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-full text-sm text-primary-700 mb-4">
          <Sparkles className="w-4 h-4" />
          {t('search:header.badge')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {t('search:header.title')}
        </h1>
        <p className="text-gray-500">
          {t('search:header.subtitle')}
        </p>
      </div>

      {/* Search Box */}
      <div className="relative mb-6">
        <div className={`
          relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200
          ${query ? 'border-primary-400 shadow-primary-100' : 'border-gray-200'}
        `}>
          <div className="flex items-center px-4 py-3">
            <SearchIcon className={`w-5 h-5 mr-3 transition-colors ${query ? 'text-primary-500' : 'text-gray-400'}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search:input.placeholder')}
              className="flex-1 text-lg bg-transparent outline-none placeholder-gray-400"
            />
            {loading && (
              <div className="mr-3">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {query && !loading && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults(null);
                  setShowRecent(true);
                  inputRef.current?.focus();
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 border-l border-gray-200 pl-3">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">↓</kbd>
              <span className="mx-1">{t('search:keyboard.toNavigate')}</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">↵</kbd>
              <span>{t('search:keyboard.toSelect')}</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {ENTITY_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => toggleType(type.key)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-150 border
                  ${selectedTypes.includes(type.key)
                    ? `${type.bgColor} ${type.color} ${type.borderColor}`
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <type.icon className="w-3.5 h-3.5" />
                {t(type.labelKey)}
              </button>
            ))}
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="text-sm text-gray-500 hover:text-gray-700 px-2"
              >
                {t('search:filters.clear')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Recent Searches */}
        {showRecent && !query && recentSearches.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Clock className="w-4 h-4" />
                {t('search:recent.title')}
              </div>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {t('search:recent.clearAll')}
              </button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                >
                  <SearchIcon className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-gray-700">{search}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {showRecent && !query && recentSearches.length === 0 && (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('search:empty.title')}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {t('search:empty.description')}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && query && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              {t('search:loading')}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div>
            {/* Results Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('search:results.count', { count: results.total_count })}
                  {selectedTypes.length > 0 && (
                    <span className="text-gray-400"> {t('search:results.inCategories', { count: selectedTypes.length })}</span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {t('search:results.pressEnter')} <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 text-gray-500">↵</kbd> {t('search:results.toOpen')}
                </span>
              </div>
            </div>

            {/* Results List */}
            {allResults.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('search:results.noResults')}</h3>
                <p className="text-gray-500">
                  {t('search:results.noResultsHint')}
                </p>
              </div>
            ) : (
              <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
                {allResults.map((item, idx) => {
                  const config = getEntityConfig(item.type);
                  const Icon = config.icon;
                  const isSelected = idx === selectedIndex;
                  const displayText = item.name || item.title || item.reference || item.citation || item.summary || item.overview;
                  const secondaryText = item.description || item.text || item.summary || item.overview;

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      data-result-item
                      onClick={() => handleResultClick(item)}
                      className={`
                        flex items-start gap-4 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0
                        ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className={`p-2 rounded-xl ${config.bgColor} flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] uppercase tracking-wider font-semibold ${config.color}`}>
                            {t(config.labelKey).replace(/s$/, '')}
                          </span>
                          {item.category && (
                            <span className="text-[10px] text-gray-400">• {item.category}</span>
                          )}
                          {item.care_domain && (
                            <span className="text-[10px] text-gray-400">• {item.care_domain}</span>
                          )}
                          {item.condition_name && (
                            <span className="text-[10px] text-gray-400">• {item.condition_name}</span>
                          )}
                          {item.intervention_name && (
                            <span className="text-[10px] text-gray-400">• {item.intervention_name}</span>
                          )}
                          {item.section_type && (
                            <span className="text-[10px] text-gray-400">• {item.section_type.replace(/_/g, ' ')}</span>
                          )}
                          {item.intensity_level && (
                            <span className="text-[10px] text-gray-400">• {item.intensity_level}</span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">
                          <HighlightedText text={displayText} query={query} />
                        </h4>
                        {secondaryText && secondaryText !== displayText && (
                          <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                            <HighlightedText text={secondaryText} query={query} />
                          </p>
                        )}
                        {item.theme && (
                          <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            {item.theme}
                          </span>
                        )}
                      </div>
                      <div className={`flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex items-center gap-1 text-xs text-primary-600">
                          <span>{t('search:results.open')}</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Footer */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 shadow-sm">Esc</kbd>
          <span>{t('search:keyboard.toClear')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 shadow-sm">
            <ChevronUp className="w-3 h-3 inline" />
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 shadow-sm">
            <ChevronDown className="w-3 h-3 inline" />
          </kbd>
          <span>{t('search:keyboard.toNavigate')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 shadow-sm">↵</kbd>
          <span>{t('search:results.toOpen')}</span>
        </div>
      </div>
    </div>
  );
};

export default Search;
