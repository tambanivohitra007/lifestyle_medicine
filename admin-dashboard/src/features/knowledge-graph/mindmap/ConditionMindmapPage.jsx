import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Network,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import api from '../../../lib/api';
import ConditionMindmap from './ConditionMindmap';

/**
 * Page wrapper for the condition mindmap
 */
const ConditionMindmapPage = () => {
  const { t } = useTranslation(['knowledgeGraph', 'conditions']);
  const { id: conditionId } = useParams();
  const [condition, setCondition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch basic condition info for the header
  useEffect(() => {
    const fetchCondition = async () => {
      if (!conditionId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/conditions/${conditionId}`);
        setCondition(response.data.data || response.data);
      } catch (err) {
        console.error('Failed to fetch condition:', err);
        setError(err.response?.data?.message || 'Failed to load condition');
      } finally {
        setLoading(false);
      }
    };

    fetchCondition();
  }, [conditionId]);

  // Handle node click - could open details panel or navigate
  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    // Could implement: open details drawer, navigate to entity, etc.
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-600">{t('loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t('error', 'Error')}
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/conditions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToConditions', 'Back to Conditions')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to={`/conditions/${conditionId}`}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={t('backToCondition', 'Back to Condition')}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">
                {t('mindmap.title', 'Condition Mindmap')}
              </h1>
              <p className="text-sm text-gray-500">
                {condition?.name}
                {condition?.category && (
                  <span className="ml-2 text-gray-400">
                    ({condition.category})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/knowledge-graph/condition/${conditionId}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Network className="w-4 h-4" />
            {t('viewGraph', 'View Full Graph')}
          </Link>
        </div>
      </header>

      {/* Mindmap Canvas */}
      <main className="flex-1 overflow-hidden">
        <ConditionMindmap
          conditionId={conditionId}
          onNodeClick={handleNodeClick}
          className="h-full"
        />
      </main>
    </div>
  );
};

export default ConditionMindmapPage;
