import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Edit, Trash2, Stethoscope } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

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
  const [studyTypeFilter, setStudyTypeFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [studyTypeFilter, qualityFilter]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (studyTypeFilter) params.study_type = studyTypeFilter;
      if (qualityFilter) params.quality_rating = qualityFilter;

      const response = await api.get(apiEndpoints.evidenceEntries, { params });
      setEntries(response.data.data);
    } catch (error) {
      console.error('Error fetching evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this evidence entry?')) return;

    try {
      await api.delete(`${apiEndpoints.evidenceEntriesAdmin}/${id}`);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting evidence:', error);
      alert('Failed to delete evidence entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evidence Entries</h1>
          <p className="text-gray-600 mt-1">
            Manage evidence supporting interventions
          </p>
        </div>
        <Link to="/evidence/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Evidence
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No evidence entries found
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding evidence for interventions.
          </p>
          <Link to="/evidence/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Evidence
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
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
                      <Stethoscope className="w-4 h-4 text-green-500" />
                      <Link
                        to={`/interventions/${entry.intervention.id}`}
                        className="text-sm font-medium text-green-600 hover:underline"
                      >
                        {entry.intervention.name}
                      </Link>
                    </div>
                  )}

                  {entry.summary && (
                    <p className="text-gray-700 mb-2">{entry.summary}</p>
                  )}

                  {entry.population && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Population:</span> {entry.population}
                    </p>
                  )}

                  {entry.references && entry.references.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {entry.references.length} reference(s)
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    to={`/evidence/${entry.id}/edit`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Evidence;
