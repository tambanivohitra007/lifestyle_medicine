import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph';
import api, { apiEndpoints } from '../../lib/api';

const KnowledgeGraphPage = () => {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch entity name for breadcrumbs
  useEffect(() => {
    const fetchEntityName = async () => {
      try {
        let endpoint;
        if (type === 'condition') {
          endpoint = `${apiEndpoints.conditions}/${id}`;
        } else if (type === 'intervention') {
          endpoint = `${apiEndpoints.interventions}/${id}`;
        }

        if (endpoint) {
          const response = await api.get(endpoint);
          const data = response.data.data;
          setEntityName(data.name || data.title || 'Unknown');
        }
      } catch (err) {
        console.error('Failed to fetch entity name:', err);
        setEntityName('Unknown');
      } finally {
        setLoading(false);
      }
    };

    fetchEntityName();
  }, [type, id]);

  const backButton = (
    <Link
      to={`/${type}s/${id}`}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">Back to {loading ? '...' : entityName}</span>
    </Link>
  );

  return (
    <div className="h-screen overflow-hidden">
      <KnowledgeGraph
        centerType={type}
        centerId={id}
        initialDepth={parseInt(searchParams.get('depth') || '2')}
        className="h-full w-full"
        backButton={backButton}
      />
    </div>
  );
};

export default KnowledgeGraphPage;
