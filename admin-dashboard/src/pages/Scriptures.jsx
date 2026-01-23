import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, BookOpen, Edit, Trash2 } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const Scriptures = () => {
  const [scriptures, setScriptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [themeFilter, setThemeFilter] = useState('');

  useEffect(() => {
    fetchScriptures();
  }, [searchTerm, themeFilter]);

  const fetchScriptures = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (themeFilter) params.theme = themeFilter;

      const response = await api.get(apiEndpoints.scriptures, { params });
      setScriptures(response.data.data);
    } catch (error) {
      console.error('Error fetching scriptures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this scripture?')) return;

    try {
      await api.delete(`${apiEndpoints.scripturesAdmin}/${id}`);
      fetchScriptures();
    } catch (error) {
      console.error('Error deleting scripture:', error);
      alert('Failed to delete scripture');
    }
  };

  const themes = [...new Set(scriptures.map((s) => s.theme).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scriptures</h1>
          <p className="text-gray-600 mt-1">
            Manage scripture references for spiritual care
          </p>
        </div>
        <Link to="/scriptures/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Scripture
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Scriptures Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : scriptures.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No scriptures found
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding scripture references.
          </p>
          <Link to="/scriptures/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Scripture
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scriptures.map((scripture) => (
            <div
              key={scripture.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/scriptures/${scripture.id}/edit`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(scripture.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {scripture.reference}
              </h3>

              {scripture.theme && (
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-3">
                  {scripture.theme}
                </span>
              )}

              <p className="text-gray-600 italic text-sm line-clamp-4">
                "{scripture.text}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Scriptures;
