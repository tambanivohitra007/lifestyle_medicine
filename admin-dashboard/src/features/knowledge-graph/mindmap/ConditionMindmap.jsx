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
  Expand,
  Minimize,
} from 'lucide-react';

import { useConditionMindmap } from './hooks';
import { mindmapNodeTypes } from './nodes';
import { mindmapEdgeTypes } from './edges';
import { buildExpandableMindmap, filterVisibleElements } from './utils/expandableMindmapLayout';
import { NodeDetailsPanel } from './components';

// Node colors for minimap
const nodeColor = (node) => {
  const colors = {
    centerCondition: '#ef4444',
    masterNode: node.data?.color || '#6b7280',
    interventionNode: node.data?.color || '#f43f5e',
    leafNode: node.data?.color || '#6b7280',
    sectionBranch: node.data?.color || '#6b7280',
    sectionItem: node.data?.color || '#6b7280',
    intervention: node.data?.color || '#f43f5e',
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
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [allNodesData, setAllNodesData] = useState({ nodes: [], edges: [], hierarchy: {} });
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Fetch mindmap data
  const { data, loading, error, refetch, condition, meta } = useConditionMindmap(conditionId);

  // Build full graph structure when data changes
  useEffect(() => {
    if (!data) return;

    // Initialize with center node expanded
    const conditionNodeId = `condition-${data.condition.id}`;
    const initialExpanded = new Set([conditionNodeId]);
    setExpandedNodes(initialExpanded);

    // Build the complete graph structure
    const graphData = buildExpandableMindmap(data, initialExpanded);
    setAllNodesData(graphData);

    // Filter visible elements
    const { nodes: visibleNodes, edges: visibleEdges } = filterVisibleElements(
      graphData.nodes,
      graphData.edges,
      initialExpanded
    );

    setNodes(visibleNodes);
    setEdges(visibleEdges);

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.3, duration: 500 });
    }, 100);
  }, [data, setNodes, setEdges, fitView]);

  // Update visible nodes when expansion state changes
  useEffect(() => {
    if (allNodesData.nodes.length === 0) return;

    // Rebuild graph with new expansion state
    const graphData = buildExpandableMindmap(data, expandedNodes);
    setAllNodesData(graphData);

    // Filter visible elements
    const { nodes: visibleNodes, edges: visibleEdges } = filterVisibleElements(
      graphData.nodes,
      graphData.edges,
      expandedNodes
    );

    setNodes(visibleNodes);
    setEdges(visibleEdges);

    // Fit view with animation
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [expandedNodes, data, setNodes, setEdges, fitView, allNodesData.nodes.length]);

  // Handle node click - toggle expansion or show details
  const handleNodeClick = useCallback((event, node) => {
    // Check if click was on the expand/collapse button area
    const isExpandClick = node.data.expandable && node.data.childCount > 0;

    if (isExpandClick) {
      // Toggle expansion
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          // Collapse: remove this node and all its descendants
          newSet.delete(node.id);
          // Also collapse all children
          const collapseDescendants = (nodeId) => {
            const children = allNodesData.hierarchy[nodeId] || [];
            children.forEach(childId => {
              newSet.delete(childId);
              collapseDescendants(childId);
            });
          };
          collapseDescendants(node.id);
        } else {
          // Expand this node
          newSet.add(node.id);
        }
        return newSet;
      });
    } else {
      // Show details panel for non-expandable nodes or for viewing details
      setSelectedNode(node);
    }

    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick, allNodesData.hierarchy]);

  // Handle double-click to show details even for expandable nodes
  const handleNodeDoubleClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handle node hover for highlighting
  const handleNodeMouseEnter = useCallback((event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Handle closing the details panel
  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    const allExpandableIds = new Set();
    allNodesData.nodes.forEach(node => {
      if (node.data.expandable) {
        allExpandableIds.add(node.id);
      }
    });
    setExpandedNodes(allExpandableIds);
  }, [allNodesData.nodes]);

  // Collapse all (except center)
  const handleCollapseAll = useCallback(() => {
    if (data?.condition?.id) {
      setExpandedNodes(new Set([`condition-${data.condition.id}`]));
    }
  }, [data?.condition?.id]);

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
    const element = document.querySelector('.react-flow');
    if (element) {
      import('html-to-image').then(({ toPng }) => {
        toPng(element, {
          backgroundColor: '#ffffff',
          filter: (node) => {
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
    <div className={`h-full w-full relative ${className}`}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={mindmapNodeTypes}
        edgeTypes={mindmapEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
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
            {/* Instructions */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {t('clickToExpand', 'Click nodes to expand/collapse. Double-click for details.')}
              </p>
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
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-blue-50 rounded">
                <span className="text-blue-700">{t('sections', 'Sections')}</span>
                <span className="font-bold text-blue-800">{meta?.totalSections || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-rose-50 rounded">
                <span className="text-rose-700">{t('interventions', 'Interventions')}</span>
                <span className="font-bold text-rose-800">{meta?.totalInterventions || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-amber-50 rounded">
                <span className="text-amber-700">{t('recipes', 'Recipes')}</span>
                <span className="font-bold text-amber-800">{meta?.totalRecipes || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-indigo-50 rounded">
                <span className="text-indigo-700">{t('scriptures', 'Scriptures')}</span>
                <span className="font-bold text-indigo-800">{meta?.totalScriptures || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-purple-50 rounded">
                <span className="text-purple-700">{t('egwRefs', 'EGW Refs')}</span>
                <span className="font-bold text-purple-800">{meta?.totalEgwReferences || 0}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Control buttons */}
        <Panel position="bottom-right" className="!m-4">
          <div className="flex flex-col gap-2">
            {/* Expand/Collapse All */}
            <button
              onClick={handleExpandAll}
              className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              title={t('expandAll', 'Expand All')}
            >
              <Expand className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              title={t('collapseAll', 'Collapse All')}
            >
              <Minimize className="w-4 h-4 text-gray-600" />
            </button>

            <div className="h-px bg-gray-200 my-1" />

            {/* Zoom controls */}
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

            <div className="h-px bg-gray-200 my-1" />

            {/* Other controls */}
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

      {/* Node Details Panel */}
      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onClose={handleClosePanel}
        />
      )}
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
