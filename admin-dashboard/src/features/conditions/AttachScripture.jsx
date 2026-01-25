import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Search, Check, Loader2, BookOpen } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const AttachScripture = () => {
  const { id: conditionId } = useParams();
  const navigate = useNavigate();

  const [condition, setCondition] = useState(null);
  const [scriptures, setScriptures] = useState([]);
  const [linkedScriptureIds, setLinkedScriptureIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedScripture, setSelectedScripture] = useState(null);

  useEffect(() => {
    fetchData();
  }, [conditionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conditionRes, scripturesRes, linkedRes] = await Promise.all([
        api.get(`${apiEndpoints.conditions}/${conditionId}`),
        api.get(apiEndpoints.scriptures),
        api.get(apiEndpoints.conditionScriptures(conditionId)),
      ]);

      setCondition(conditionRes.data.data);
      setScriptures(scripturesRes.data.data);
      setLinkedScriptureIds(linkedRes.data.data.map((s) => s.id));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      navigate(`/conditions/${conditionId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async () => {
    if (!selectedScripture) return;

    try {
      setSaving(true);
      await api.post(apiEndpoints.attachConditionScripture(conditionId, selectedScripture.id));
      navigate(`/conditions/${conditionId}`);
    } catch (error) {
      console.error('Error attaching scripture:', error);
      toast.error('Failed to attach scripture');
    } finally {
      setSaving(false);
    }
  };

  const themes = [...new Set(scriptures.map((s) => s.theme).filter(Boolean))];

  const filteredScriptures = scriptures.filter((scripture) => {
    const matchesSearch =
      scripture.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scripture.text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTheme = !themeFilter || scripture.theme === themeFilter;
    const notLinked = !linkedScriptureIds.includes(scripture.id);
    return matchesSearch && matchesTheme && notLinked;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Conditions', href: '/conditions' },
          { label: condition?.name || 'Condition', href: `/conditions/${conditionId}` },
          { label: 'Attach Scripture' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attach Scripture</h1>
        {condition && (
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Link a scripture to: <span className="font-medium">{condition.name}</span>
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scriptures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={themeFilter}
            onChange={(e) => setThemeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Themes</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scripture List */}
      {filteredScriptures.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <BookOpen className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            No available scriptures
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            All scriptures are already linked or none match your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {filteredScriptures.map((scripture) => (
            <button
              key={scripture.id}
              type="button"
              onClick={() => setSelectedScripture(scripture)}
              className={`card text-left transition-all touch-manipulation ${
                selectedScripture?.id === scripture.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-lg active:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{scripture.reference}</h3>
                </div>
                {selectedScripture?.id === scripture.id && (
                  <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                )}
              </div>
              {scripture.theme && (
                <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full mb-2">
                  {scripture.theme}
                </span>
              )}
              <p className="text-xs sm:text-sm text-gray-600 italic line-clamp-3">
                "{scripture.text}"
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Actions - Fixed bottom bar on mobile */}
      {selectedScripture && (
        <div className="card fixed sm:sticky bottom-0 left-0 right-0 sm:bottom-4 rounded-none sm:rounded-lg shadow-lg sm:shadow border-t sm:border border-gray-200 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-gray-700 text-sm sm:text-base truncate">
              Selected: <span className="font-medium">{selectedScripture.reference}</span>
            </p>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setSelectedScripture(null)}
                className="btn-outline flex-1 sm:flex-initial justify-center touch-manipulation"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleAttach}
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial touch-manipulation"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">{saving ? 'Attaching...' : 'Attach Scripture'}</span>
                <span className="sm:hidden">{saving ? 'Attaching...' : 'Attach'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachScripture;
