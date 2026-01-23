import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  Heart,
  Activity,
  Book,
  ChefHat,
  FileText,
  Library,
  Loader2,
  Filter,
} from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const ENTITY_TYPES = [
  { key: 'conditions', label: 'Conditions', icon: Heart, color: 'text-primary-600', bgColor: 'bg-primary-100' },
  { key: 'interventions', label: 'Interventions', icon: Activity, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
  { key: 'scriptures', label: 'Scriptures', icon: Book, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { key: 'recipes', label: 'Recipes', icon: ChefHat, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { key: 'evidence', label: 'Evidence', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { key: 'references', label: 'References', icon: Library, color: 'text-gray-600', bgColor: 'bg-gray-100' },
];

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || query.length < 2) return;

    try {
      setLoading(true);
      const params = { q: query, limit: 20 };
      if (selectedTypes.length > 0) {
        params.types = selectedTypes.join(',');
      }
      const response = await api.get(apiEndpoints.search, { params });
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getEntityLink = (type, id) => {
    const routes = {
      condition: `/conditions/${id}`,
      intervention: `/interventions/${id}`,
      scripture: `/scriptures/${id}/edit`,
      recipe: `/recipes/${id}`,
      evidence: `/evidence/${id}/edit`,
      reference: `/references/${id}/edit`,
    };
    return routes[type] || '#';
  };

  const getEntityConfig = (type) => {
    const configs = {
      condition: ENTITY_TYPES.find((e) => e.key === 'conditions'),
      intervention: ENTITY_TYPES.find((e) => e.key === 'interventions'),
      scripture: ENTITY_TYPES.find((e) => e.key === 'scriptures'),
      recipe: ENTITY_TYPES.find((e) => e.key === 'recipes'),
      evidence: ENTITY_TYPES.find((e) => e.key === 'evidence'),
      reference: ENTITY_TYPES.find((e) => e.key === 'references'),
    };
    return configs[type] || ENTITY_TYPES[0];
  };

  const renderResultItem = (item) => {
    const config = getEntityConfig(item.type);
    const Icon = config.icon;

    return (
      <Link
        key={`${item.type}-${item.id}`}
        to={getEntityLink(item.type, item.id)}
        className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all touch-manipulation"
      >
        <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
              {config.label.slice(0, -1)}
            </span>
          </div>
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">
            {item.name || item.title || item.reference || item.citation || item.summary}
          </h3>
          {(item.description || item.text || item.summary) && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {item.description || item.text || item.summary}
            </p>
          )}
          {item.category && (
            <span className="inline-block mt-2 text-xs text-gray-500">{item.category}</span>
          )}
          {item.care_domain && (
            <span className="inline-block mt-2 text-xs text-gray-500">{item.care_domain}</span>
          )}
          {item.theme && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
              {item.theme}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const allResults = results
    ? Object.values(results.results).flat()
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Global Search</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Search across all content in the knowledge platform
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conditions, interventions, scriptures, recipes..."
                className="input-field pl-10"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-outline flex items-center gap-2 ${
                selectedTypes.length > 0 ? 'border-primary-500 text-primary-600' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {selectedTypes.length > 0 && (
                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedTypes.length}
                </span>
              )}
            </button>
            <button type="submit" disabled={loading || query.length < 2} className="btn-primary">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Filter by type:</p>
              <div className="flex flex-wrap gap-2">
                {ENTITY_TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => toggleType(type.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
                      selectedTypes.includes(type.key)
                        ? `${type.bgColor} ${type.color}`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
              {selectedTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTypes([])}
                  className="text-sm text-primary-600 hover:text-primary-700 mt-3"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : results ? (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found <span className="font-medium">{results.total_count}</span> results for "
              <span className="font-medium">{results.query}</span>"
            </p>
          </div>

          {/* Results List */}
          {allResults.length === 0 ? (
            <div className="card text-center py-12">
              <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try a different search term or adjust your filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allResults.map(renderResultItem)}
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Search the Knowledge Platform
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter at least 2 characters to search across conditions, interventions,
            scriptures, recipes, evidence, and references.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
