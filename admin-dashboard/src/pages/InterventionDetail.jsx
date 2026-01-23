import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Stethoscope,
  Layers,
  FileText,
  Heart,
  AlertCircle,
  Image,
  Download,
  ExternalLink,
} from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast, confirmDelete } from '../lib/swal';

const QUALITY_RATING = {
  A: { label: 'A - High', color: 'bg-green-100 text-green-700' },
  B: { label: 'B - Good', color: 'bg-blue-100 text-blue-700' },
  C: { label: 'C - Moderate', color: 'bg-yellow-100 text-yellow-700' },
  D: { label: 'D - Low', color: 'bg-red-100 text-red-700' },
};

const STUDY_TYPE = {
  rct: 'Randomized Controlled Trial',
  meta_analysis: 'Meta-Analysis',
  systematic_review: 'Systematic Review',
  observational: 'Observational Study',
  case_series: 'Case Series',
  expert_opinion: 'Expert Opinion',
};

const InterventionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intervention, setIntervention] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [interventionRes, evidenceRes, conditionsRes] = await Promise.all([
        api.get(`${apiEndpoints.interventions}/${id}`),
        api.get(apiEndpoints.interventionEvidence(id)),
        api.get(apiEndpoints.interventionConditions(id)),
      ]);

      setIntervention(interventionRes.data.data);
      setEvidence(evidenceRes.data.data || []);
      setConditions(conditionsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching intervention:', error);
      toast.error('Failed to load intervention');
      navigate('/interventions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete(intervention?.name || 'this intervention');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.interventionsAdmin}/${id}`);
      toast.success('Intervention deleted');
      navigate('/interventions');
    } catch (error) {
      console.error('Error deleting intervention:', error);
      toast.error('Failed to delete intervention');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Intervention not found
        </h3>
        <Link to="/interventions" className="text-primary-600 hover:text-primary-700">
          Back to interventions
        </Link>
      </div>
    );
  }

  const mediaItems = intervention.media || [];
  const tabs = [
    { id: 'details', label: 'Details', icon: Stethoscope },
    { id: 'evidence', label: 'Evidence', icon: FileText, count: evidence.length },
    { id: 'conditions', label: 'Conditions', icon: Heart, count: conditions.length },
    { id: 'media', label: 'Media', icon: Image, count: mediaItems.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/interventions"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{intervention.name}</h1>
            {intervention.care_domain && (
              <div className="flex items-center gap-2 mt-2">
                <Layers className="w-4 h-4 text-secondary-500" />
                <span className="text-secondary-600 font-medium">
                  {intervention.care_domain.name}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/interventions/${id}/edit`}
            className="btn-outline flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {intervention.description && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{intervention.description}</p>
              </div>
            )}

            {intervention.mechanism && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Mechanism of Action</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{intervention.mechanism}</p>
              </div>
            )}

            {!intervention.description && !intervention.mechanism && (
              <div className="card text-center py-8">
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No additional details added yet</p>
                <Link
                  to={`/interventions/${id}/edit`}
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                >
                  Add details
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            {evidence.length === 0 ? (
              <div className="card text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No evidence entries linked yet</p>
                <Link
                  to="/evidence"
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                >
                  Manage evidence entries
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {evidence.map((entry) => (
                  <div key={entry.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {entry.quality_rating && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              QUALITY_RATING[entry.quality_rating]?.color || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {QUALITY_RATING[entry.quality_rating]?.label || entry.quality_rating}
                          </span>
                        )}
                        {entry.study_type && (
                          <span className="text-sm text-gray-500">
                            {STUDY_TYPE[entry.study_type] || entry.study_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {entry.summary && (
                      <p className="text-gray-700 mb-3">{entry.summary}</p>
                    )}

                    {entry.population && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Population:</span> {entry.population}
                      </p>
                    )}

                    {entry.references && entry.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">References:</p>
                        <ul className="space-y-1">
                          {entry.references.map((ref) => (
                            <li key={ref.id} className="text-sm text-gray-600">
                              {ref.citation}
                              {ref.year && ` (${ref.year})`}
                              {ref.doi && (
                                <a
                                  href={`https://doi.org/${ref.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:underline ml-2"
                                >
                                  DOI
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conditions Tab */}
        {activeTab === 'conditions' && (
          <div className="space-y-4">
            {conditions.length === 0 ? (
              <div className="card text-center py-8">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Not linked to any conditions yet</p>
                <Link
                  to="/conditions"
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                >
                  Link to conditions
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {conditions.map((condition) => (
                  <Link
                    key={condition.id}
                    to={`/conditions/${condition.id}`}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Heart className="w-5 h-5 text-primary-500" />
                      <h3 className="font-semibold text-gray-900">{condition.name}</h3>
                    </div>
                    {condition.category && (
                      <span className="inline-block px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                        {condition.category}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {mediaItems.length === 0 ? (
              <div className="card text-center py-8">
                <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No media files uploaded yet</p>
                <Link
                  to={`/interventions/${id}/edit`}
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                >
                  Upload media files
                </Link>
              </div>
            ) : (
              <>
                {/* Images */}
                {mediaItems.filter((m) => m.type === 'image').length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Images</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {mediaItems
                        .filter((m) => m.type === 'image')
                        .map((item) => (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square"
                          >
                            <img
                              src={item.url}
                              alt={item.alt_text || item.original_filename}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="w-6 h-6 text-white" />
                            </div>
                            {item.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                                {item.caption}
                              </div>
                            )}
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {mediaItems.filter((m) => m.type === 'document').length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Documents</h3>
                    <div className="space-y-2">
                      {mediaItems
                        .filter((m) => m.type === 'document')
                        .map((item) => (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                          >
                            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                              <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.original_filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.formatted_size}
                                {item.caption && ` • ${item.caption}`}
                              </p>
                            </div>
                            <Download className="w-5 h-5 text-gray-400" />
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventionDetail;
