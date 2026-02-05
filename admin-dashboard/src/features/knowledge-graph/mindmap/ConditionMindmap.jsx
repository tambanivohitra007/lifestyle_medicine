import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Info,
} from 'lucide-react';

import { useConditionMindmap } from './hooks';
import { mindmapNodeTypes } from './nodes';
import { mindmapEdgeTypes } from './edges';
import { buildMindmapGraph } from './utils/mindmapLayout';

// Node colors for minimap
const nodeColor = (node) => {
  const colors = {
    centerCondition: '#ef4444',
    branchLabel: node.data?.color || '#6b7280',
    riskFactor: node.data?.color || '#f97316',
    complication: node.data?.color || '#dc2626',
    solutionCategory: node.data?.color || '#3b82f6',
    intervention: '#f43f5e',
    scripture: '#6366f1',
    recipe: '#f59e0b',
    egwReference: '#8b5cf6',
  };
  return colors[node.type] || '#6b7280';
};

/**
 * Inner mindmap component (requires ReactFlowProvider)
 */
const ConditionMindmapInner = ({
  conditionId,
  onNodeClick,
  className = '',
}) => {
  const { t } = useTranslation(['knowledgeGraph']);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // selectedNode will be used for details panel in future implementation
  const [, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Fetch mindmap data
  const { data, loading, error, refetch, condition, meta } = useConditionMindmap(conditionId);

  // Build graph when data changes
  useEffect(() => {
    if (!data) return;

    const { nodes: graphNodes, edges: graphEdges } = buildMindmapGraph(data);
    setNodes(graphNodes);
    setEdges(graphEdges);

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 100);
  }, [data, setNodes, setEdges, fitView]);

  // Handle node click
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  // Handle node hover for highlighting
  const handleNodeMouseEnter = useCallback((event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Compute display nodes/edges with hover highlighting
  const { displayNodes, displayEdges } = useMemo(() => {
    if (!hoveredNodeId) {
      return { displayNodes: nodes, displayEdges: edges };
    }

    // Find connected node IDs
    const connectedIds = new Set([hoveredNodeId]);
    edges.forEach((edge) => {
      if (edge.source === hoveredNodeId) connectedIds.add(edge.target);
      if (edge.target === hoveredNodeId) connectedIds.add(edge.source);
    });

    // Update node opacity
    const displayNodes = nodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        opacity: connectedIds.has(node.id) ? 1 : 0.3,
        transition: 'opacity 0.2s',
      },
    }));

    // Update edge opacity
    const displayEdges = edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: edge.source === hoveredNodeId || edge.target === hoveredNodeId ? 1 : 0.2,
        transition: 'opacity 0.2s',
      },
    }));

    return { displayNodes, displayEdges };
  }, [nodes, edges, hoveredNodeId]);

  // Export as PNG
  const handleExport = useCallback(() => {
    // Use html-to-image library if available
    const element = document.querySelector('.react-flow');
    if (element) {
      import('html-to-image').then(({ toPng }) => {
        toPng(element, {
          backgroundColor: '#ffffff',
          filter: (node) => {
            // Filter out minimap and controls
            if (node.classList?.contains('react-flow__minimap')) return false;
            if (node.classList?.contains('react-flow__controls')) return false;
            return true;
          },
        }).then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `${condition?.name || 'condition'}-mindmap.png`;
          link.href = dataUrl;
          link.click();
        });
      });
    }
  }, [condition]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-600">{t('loading', 'Loading mindmap...')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t('error', 'Failed to load mindmap')}
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('retry', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={mindmapNodeTypes}
        edgeTypes={mindmapEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'mindmap',
        }}
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white !border !border-gray-200 !rounded-lg"
        />

        {/* Title Panel */}
        <Panel position="top-left" className="!m-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  {condition?.name}
                </h2>
                {condition?.category && (
                  <span className="text-sm text-gray-500">
                    {condition.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-right" className="!m-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3">
            <div className="flex items-center gap-1 mb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t('stats', 'Statistics')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-orange-50 rounded">
                <span className="text-orange-700">Risk Factors</span>
                <span className="font-bold text-orange-800">{meta?.totalRiskFactors || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-red-50 rounded">
                <span className="text-red-700">Complications</span>
                <span className="font-bold text-red-800">{meta?.totalComplications || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-blue-50 rounded">
                <span className="text-blue-700">Interventions</span>
                <span className="font-bold text-blue-800">{meta?.totalInterventions || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-amber-50 rounded">
                <span className="text-amber-700">Recipes</span>
                <span className="font-bold text-amber-800">{meta?.totalRecipes || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-indigo-50 rounded">
                <span className="text-indigo-700">Scriptures</span>
                <span className="font-bold text-indigo-800">{meta?.totalScriptures || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-purple-50 rounded">
                <span className="text-purple-700">EGW Refs</span>
                <span className="font-bold text-purple-800">{meta?.totalEgwReferences || 0}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Control buttons */}
        <Panel position="bottom-right" className="!m-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => zoomIn({ duration: 300 })}
              className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              title={t('zoomIn', 'Zoom In')}
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => zoomOut({ duration: 300 })}
              className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              title={t('zoomOut', 'Zoom Out')}
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 500 })}
              className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              title={t('fitView', 'Fit View')}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              title={t('export', 'Export as PNG')}
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={refetch}
              className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              title={t('refresh', 'Refresh')}
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

/**
 * Condition Mindmap component with provider wrapper
 */
const ConditionMindmap = (props) => {
  return (
    <ReactFlowProvider>
      <ConditionMindmapInner {...props} />
    </ReactFlowProvider>
  );
};

export default ConditionMindmap;
