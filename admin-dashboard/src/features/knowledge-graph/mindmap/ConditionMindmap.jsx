import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Filter,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

import { useConditionMindmap } from './hooks';
import { mindmapNodeTypes } from './nodes';
import { mindmapEdgeTypes } from './edges';
import { buildExpandableMindmap, filterVisibleElements } from './utils/expandableMindmapLayout';
import { resolveCollisions } from './utils/resolveCollisions';
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
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Fetch mindmap data - must be before callbacks that use it
  const { data, loading, error, refetch, condition, meta } = useConditionMindmap(conditionId);

  // Track user-moved node positions (persists across re-renders and rebuilds)
  const userMovedPositions = useRef(new Map());

  // Track the last expanded node for viewport focus
  const lastExpandedNode = useRef(null);

  // Custom nodes change handler that tracks user-dragged positions
  const handleNodesChange = useCallback((changes) => {
    // Process changes to detect user drag operations
    changes.forEach((change) => {
      if (change.type === 'position' && change.dragging === false && change.position) {
        // User finished dragging a node - save its new position
        userMovedPositions.current.set(change.id, {
          x: change.position.x,
          y: change.position.y,
        });
      }
    });

    // Apply the changes as normal
    onNodesChange(changes);
  }, [onNodesChange]);

  // Handle node drag stop - resolve collisions after user drags a node
  const handleNodeDragStop = useCallback(() => {
    setNodes((currentNodes) => {
      // Get the center node ID to keep it fixed
      const centerNodeId = data?.condition?.id ? `condition-${data.condition.id}` : null;
      const fixedNodeIds = centerNodeId ? new Set([centerNodeId]) : new Set();

      const resolvedNodes = resolveCollisions(currentNodes, {
        maxIterations: 100,
        overlapThreshold: 0.5,
        margin: 20,
        fixedNodeIds,
      });

      // Update user positions with resolved positions
      resolvedNodes.forEach((node) => {
        if (userMovedPositions.current.has(node.id)) {
          userMovedPositions.current.set(node.id, {
            x: node.position.x,
            y: node.position.y,
          });
        }
      });

      return resolvedNodes;
    });
  }, [setNodes, data?.condition?.id]);

  // Extract available categories from data for filter panel
  const availableCategories = useMemo(() => {
    if (!data) return [];

    const categories = [];

    // Sections (left side)
    const sections = data.sections || {};
    Object.entries(sections).forEach(([key, section]) => {
      if (section.items && section.items.length > 0) {
        categories.push({
          id: `master-section-${key}`,
          key,
          label: section.label,
          color: section.color,
          count: section.items.length,
          type: 'section',
        });
      }
    });

    // Solutions (right side)
    const solutions = data.branches?.solutions || {};
    Object.entries(solutions).forEach(([key, solutionData]) => {
      if (!solutionData?.careDomain) return;
      const childCount = (solutionData.interventions?.length || 0) +
                         (solutionData.scriptures?.length || 0) +
                         (solutionData.egwReferences?.length || 0);
      if (childCount > 0) {
        categories.push({
          id: `master-solution-${key}`,
          key,
          label: solutionData.careDomain.name,
          color: solutionData.careDomain.color || '#6b7280',
          count: childCount,
          type: 'solution',
        });
      }
    });

    return categories;
  }, [data]);

  // Toggle category visibility
  const toggleCategory = useCallback((categoryId) => {
    setHiddenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Show all categories
  const showAllCategories = useCallback(() => {
    setHiddenCategories(new Set());
  }, []);

  // Hide all categories
  const hideAllCategories = useCallback(() => {
    const allIds = new Set(availableCategories.map(c => c.id));
    setHiddenCategories(allIds);
  }, [availableCategories]);

  // Build full graph structure when data changes
  useEffect(() => {
    if (!data) return;

    // Initialize with center node expanded
    const conditionNodeId = `condition-${data.condition.id}`;
    const initialExpanded = new Set([conditionNodeId]);
    setExpandedNodes(initialExpanded);

    // Clear user positions when data changes (new condition loaded)
    userMovedPositions.current.clear();

    // Build the complete graph structure
    const graphData = buildExpandableMindmap(data, initialExpanded, userMovedPositions.current);
    setAllNodesData(graphData);

    // Filter visible elements
    const { nodes: visibleNodes, edges: visibleEdges } = filterVisibleElements(
      graphData.nodes,
      graphData.edges,
      initialExpanded
    );

    // Resolve collisions after initial layout
    const resolvedNodes = resolveCollisions(visibleNodes, {
      maxIterations: 100,
      overlapThreshold: 0.5,
      margin: 20,
      fixedNodeIds: new Set([conditionNodeId]),
    });

    setNodes(resolvedNodes);
    setEdges(visibleEdges);

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.3, duration: 500 });
    }, 100);
  }, [data, setNodes, setEdges, fitView]);

  // Update visible nodes when expansion state changes
  useEffect(() => {
    if (allNodesData.nodes.length === 0) return;

    // Rebuild graph with new expansion state, preserving user-moved positions
    const graphData = buildExpandableMindmap(data, expandedNodes, userMovedPositions.current);
    setAllNodesData(graphData);

    // Filter visible elements
    const { nodes: visibleNodes, edges: visibleEdges } = filterVisibleElements(
      graphData.nodes,
      graphData.edges,
      expandedNodes
    );

    // Get fixed node IDs (center node + user-moved nodes)
    const conditionNodeId = data?.condition?.id ? `condition-${data.condition.id}` : null;
    const fixedNodeIds = new Set(userMovedPositions.current.keys());
    if (conditionNodeId) fixedNodeIds.add(conditionNodeId);

    // Resolve collisions after layout, keeping user-moved nodes fixed
    const resolvedNodes = resolveCollisions(visibleNodes, {
      maxIterations: 100,
      overlapThreshold: 0.5,
      margin: 20,
      fixedNodeIds,
    });

    setNodes(resolvedNodes);
    setEdges(visibleEdges);

    // Focus viewport on expanded node and its children
    if (lastExpandedNode.current) {
      const expandedNodeId = lastExpandedNode.current;
      const childIds = allNodesData.hierarchy[expandedNodeId] || [];

      // Include the parent node and all its direct children in the focus area
      const nodesToFocus = [expandedNodeId, ...childIds];

      setTimeout(() => {
        fitView({
          nodes: resolvedNodes.filter(n => nodesToFocus.includes(n.id)),
          padding: 0.3,
          duration: 500,
          maxZoom: 1.2, // Don't zoom in too much
        });
      }, 100);

      // Clear the ref after focusing
      lastExpandedNode.current = null;
    } else if (userMovedPositions.current.size === 0) {
      // Only auto-fit if no user positions and no specific expansion
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 50);
    }
  }, [expandedNodes, data, setNodes, setEdges, fitView, allNodesData.nodes.length, allNodesData.hierarchy]);

  // Handle node click - toggle expansion or show details
  const handleNodeClick = useCallback((event, node) => {
    // Check if click was on the expand/collapse button area
    const isExpandClick = node.data.expandable && node.data.childCount > 0;

    if (isExpandClick) {
      // Toggle expansion
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        const isCurrentlyExpanded = prev.has(node.id);

        if (isCurrentlyExpanded) {
          // Collapse: remove this node and all its descendants
          lastExpandedNode.current = null;
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
          // Expand this node - track for viewport focus
          lastExpandedNode.current = node.id;
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

  // Filter nodes by hidden categories and compute display with hover highlighting
  const { displayNodes, displayEdges } = useMemo(() => {
    // First, filter out hidden categories and their children
    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (hiddenCategories.size > 0) {
      // Build set of all nodes to hide (hidden categories + their descendants)
      const hiddenNodeIds = new Set();

      // Add hidden master nodes
      hiddenCategories.forEach(catId => {
        hiddenNodeIds.add(catId);
      });

      // Add descendants of hidden categories
      const addDescendants = (nodeId) => {
        const children = allNodesData.hierarchy[nodeId] || [];
        children.forEach(childId => {
          hiddenNodeIds.add(childId);
          addDescendants(childId);
        });
      };

      hiddenCategories.forEach(catId => {
        addDescendants(catId);
      });

      // Filter nodes and edges
      filteredNodes = nodes.filter(node => !hiddenNodeIds.has(node.id));
      filteredEdges = edges.filter(edge =>
        !hiddenNodeIds.has(edge.source) && !hiddenNodeIds.has(edge.target)
      );
    }

    // Apply hover highlighting
    if (!hoveredNodeId) {
      return { displayNodes: filteredNodes, displayEdges: filteredEdges };
    }

    // Find connected node IDs
    const connectedIds = new Set([hoveredNodeId]);
    filteredEdges.forEach((edge) => {
      if (edge.source === hoveredNodeId) connectedIds.add(edge.target);
      if (edge.target === hoveredNodeId) connectedIds.add(edge.source);
    });

    // Update node opacity
    const displayNodes = filteredNodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        opacity: connectedIds.has(node.id) ? 1 : 0.3,
        transition: 'opacity 0.2s',
      },
    }));

    // Update edge opacity
    const displayEdges = filteredEdges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: edge.source === hoveredNodeId || edge.target === hoveredNodeId ? 1 : 0.2,
        transition: 'opacity 0.2s',
      },
    }));

    return { displayNodes, displayEdges };
  }, [nodes, edges, hoveredNodeId, hiddenCategories, allNodesData.hierarchy]);

  // Export as high-resolution PNG
  const handleExport = useCallback(() => {
    const element = document.querySelector('.react-flow');
    if (element) {
      import('html-to-image').then(({ toPng }) => {
        toPng(element, {
          backgroundColor: '#ffffff',
          pixelRatio: 4, // High resolution (4x for crisp export)
          quality: 1.0, // Maximum quality
          filter: (node) => {
            // Exclude UI controls from export
            if (node.classList?.contains('react-flow__minimap')) return false;
            if (node.classList?.contains('react-flow__controls')) return false;
            if (node.classList?.contains('react-flow__panel')) return false;
            if (node.classList?.contains('react-flow__attribution')) return false;
            return true;
          },
          style: {
            // Ensure sharp rendering
            imageRendering: 'crisp-edges',
          },
        }).then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `${condition?.name || 'condition'}-mindmap.png`;
          link.href = dataUrl;
          link.click();
        }).catch((error) => {
          console.error('Failed to export mindmap:', error);
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
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeDragStop={handleNodeDragStop}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={mindmapNodeTypes}
        edgeTypes={mindmapEdgeTypes}
        nodeOrigin={[0.5, 0.5]}
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
                {t('statsLabel', 'Statistics')}
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

        {/* Filter Panel */}
        {showFilterPanel && (
          <Panel position="top-right" className="!m-4 !mt-48">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-64 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {t('filterCategories', 'Filter Categories')}
                  </span>
                </div>
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={showAllCategories}
                  className="flex-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                >
                  {t('showAll', 'Show All')}
                </button>
                <button
                  onClick={hideAllCategories}
                  className="flex-1 text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  {t('hideAll', 'Hide All')}
                </button>
              </div>

              {/* Sections */}
              {availableCategories.filter(c => c.type === 'section').length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {t('sections', 'Sections')}
                  </div>
                  <div className="space-y-1">
                    {availableCategories
                      .filter(c => c.type === 'section')
                      .map(category => (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                            hiddenCategories.has(category.id)
                              ? 'bg-gray-100 text-gray-400'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {hiddenCategories.has(category.id) ? (
                            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-gray-600" />
                          )}
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className={`flex-1 truncate ${hiddenCategories.has(category.id) ? 'line-through' : ''}`}>
                            {category.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {category.count}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Solutions */}
              {availableCategories.filter(c => c.type === 'solution').length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {t('solutions', 'Solutions')}
                  </div>
                  <div className="space-y-1">
                    {availableCategories
                      .filter(c => c.type === 'solution')
                      .map(category => (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                            hiddenCategories.has(category.id)
                              ? 'bg-gray-100 text-gray-400'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {hiddenCategories.has(category.id) ? (
                            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-gray-600" />
                          )}
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className={`flex-1 truncate ${hiddenCategories.has(category.id) ? 'line-through' : ''}`}>
                            {category.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {category.count}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Control buttons */}
        <Panel position="bottom-right" className="!m-4">
          <div className="flex flex-col gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilterPanel(prev => !prev)}
              className={`p-2 rounded-lg shadow border transition-colors ${
                showFilterPanel || hiddenCategories.size > 0
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
              title={t('filter', 'Filter Categories')}
            >
              <Filter className="w-4 h-4" />
              {hiddenCategories.size > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {hiddenCategories.size}
                </span>
              )}
            </button>

            <div className="h-px bg-gray-200 my-1" />

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
