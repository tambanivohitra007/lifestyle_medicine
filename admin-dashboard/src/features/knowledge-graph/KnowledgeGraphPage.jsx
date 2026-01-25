import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Network, ArrowLeft, ExternalLink } from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph';
import Breadcrumbs from '../../components/shared/Breadcrumbs';
import api, { apiEndpoints } from '../../lib/api';

const KnowledgeGraphPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
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

  // Handle node click - navigate to the entity or open new graph
  const handleNodeClick = (node) => {
    const nodeType = node.type;
    const entityId = node.data.entityId;

    // Map node types to routes
    const routeMap = {
      condition: `/conditions/${entityId}`,
      intervention: `/interventions/${entityId}`,
      scripture: `/scriptures/${entityId}`,
      recipe: `/recipes/${entityId}`,
      egwReference: `/egw-references/${entityId}`,
      evidenceEntry: null, // No detail page
      reference: null, // No detail page
      careDomain: null, // No detail page
    };

    const route = routeMap[nodeType];
    if (route) {
      // Open in new tab with Ctrl/Cmd+click
      window.open(route, '_blank');
    }
  };

  // Handle double-click to recenter graph
  const handleNodeDoubleClick = (node) => {
    const nodeType = node.type;
    const entityId = node.data.entityId;

    if (nodeType === 'condition' || nodeType === 'intervention') {
      navigate(`/knowledge-graph/${nodeType}/${entityId}`);
    }
  };

  const breadcrumbItems = [
    { label: type === 'condition' ? 'Conditions' : 'Interventions', href: `/${type}s` },
    { label: loading ? '...' : entityName, href: `/${type}s/${id}` },
    { label: 'Knowledge Graph' },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Knowledge Graph</h1>
              <p className="text-sm text-gray-500">
                Explore relationships for{' '}
                <span className="font-medium text-gray-700">
                  {loading ? '...' : entityName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/${type}s/${id}`}
              className="btn-outline flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to {type}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 bg-gray-50">
        <KnowledgeGraph
          centerType={type}
          centerId={id}
          initialDepth={parseInt(searchParams.get('depth') || '2')}
          onNodeClick={handleNodeClick}
          className="h-full"
        />
      </div>

      {/* Instructions Footer */}
      <div className="flex-shrink-0 px-4 py-2 bg-white border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-center gap-4">
          <span>
            <strong>Click</strong> node to view details
          </span>
          <span>|</span>
          <span>
            <strong>Scroll</strong> to zoom
          </span>
          <span>|</span>
          <span>
            <strong>Drag</strong> to pan
          </span>
          <span>|</span>
          <span>
            <strong>Drag node</strong> to reposition
          </span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphPage;
