import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader2, Layout, Maximize2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { applyLayout, layoutOptions } from './utils/layoutEngine';
import { FilterPanel, SearchBar, ExportPanel, KeyboardShortcutsHelp, NodeDetailsPanel } from './controls';
import { useKeyboardShortcuts, useLayoutPersistence } from './hooks';
import api from '../../lib/api';

const KnowledgeGraphInner = ({
  centerType = 'condition',
  centerId,
  initialDepth = 2,
  onNodeClick,
  className = '',
  backButton = null,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [allNodes, setAllNodes] = useState([]); // Store original unfiltered nodes
  const [allEdges, setAllEdges] = useState([]); // Store original unfiltered edges
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [depth, setDepth] = useState(initialDepth);
  const [layoutType, setLayoutType] = useState('medical');
  const [meta, setMeta] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const { fitView, setCenter } = useReactFlow();

  // Layout persistence
  const graphId = `${centerType}-${centerId}`;
  const { restorePositions, clearSavedPositions } = useLayoutPersistence(
    graphId,
    nodes,
    setNodes,
    true // enabled
  );

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    if (!centerId) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = `/knowledge-graph/${centerType}/${centerId}?depth=${depth}`;
      const response = await api.get(endpoint);
      const { nodes: apiNodes, edges: apiEdges, meta: apiMeta } = response.data;

      // Ensure all edges use step path by setting type
      const processedEdges = apiEdges.map(edge => ({
        ...edge,
        type: edge.type || 'smoothstep',
      }));

      // Apply layout
      const layoutedNodes = applyLayout(apiNodes, processedEdges, layoutType);

      // Restore saved positions if available
      const restoredNodes = restorePositions(layoutedNodes);

      // Store original data for filtering
      setAllNodes(restoredNodes);
      setAllEdges(processedEdges);

      // Apply current filter
      applyFilter(restoredNodes, apiEdges, hiddenTypes);
      setMeta(apiMeta);
    } catch (err) {
      console.error('Failed to fetch knowledge graph:', err);
      setError(err.response?.data?.message || 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  }, [centerId, centerType, depth, layoutType, restorePositions]);

  // Apply filter to nodes and edges
  const applyFilter = useCallback((nodeList, edgeList, hidden) => {
    // First, filter content nodes (non-group nodes)
    const visibleContentNodes = nodeList.filter(
      (node) => node.type !== 'group' && !hidden.includes(node.type)
    );
    const visibleNodeIds = new Set(visibleContentNodes.map((node) => node.id));

    // Determine which group containers should be visible based on their content
    const visibleGroupIds = new Set();
    nodeList.forEach((node) => {
      if (node.type === 'group') {
        // Check if any content nodes belong to this group
        const groupCategory = node.id.replace('group-', '');
        const hasVisibleContent = visibleContentNodes.some((contentNode) => {
          // Match group to content nodes by category
          if (groupCategory === 'condition') return contentNode.type === 'condition';
          if (groupCategory === 'research') return contentNode.type === 'evidenceEntry' || contentNode.type === 'reference';
          if (groupCategory === 'culinary') return contentNode.type === 'recipe' || (contentNode.data?.careDomain?.toLowerCase() === 'nutrition');
          if (groupCategory === 'spiritual') return contentNode.type === 'scripture' || contentNode.type === 'egwReference' || (contentNode.data?.careDomain?.toLowerCase() === 'trust in god');
          // For other solution categories, check careDomain
          const careDomainMap = {
            'physical': ['exercise', 'sunlight', 'air'],
            'water': ['water therapy', 'hydrotherapy'],
            'mental': ['temperance', 'rest', 'mental health'],
            'medication': ['supplements', 'medications'],
          };
          const domains = careDomainMap[groupCategory] || [];
          return domains.includes(contentNode.data?.careDomain?.toLowerCase());
        });
        if (hasVisibleContent) {
          visibleGroupIds.add(node.id);
        }
      }
    });

    // Filter nodes: include visible content nodes and their group containers
    // Also handle parent-child relationships - remove parentId if parent is not visible
    const filteredNodes = nodeList
      .filter((node) => visibleNodeIds.has(node.id) || visibleGroupIds.has(node.id))
      .map((node) => {
        // If this node has a parent but the parent is not visible, remove the parent relationship
        if (node.parentId && !visibleGroupIds.has(node.parentId)) {
          const { parentId, extent, ...nodeWithoutParent } = node;
          return nodeWithoutParent;
        }
        return node;
      });

    const filteredEdges = edgeList.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [setNodes, setEdges]);

  // Handle filter toggle
  const handleToggleType = useCallback((type) => {
    setHiddenTypes((prev) => {
      const newHidden = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      applyFilter(allNodes, allEdges, newHidden);
      return newHidden;
    });
  }, [allNodes, allEdges, applyFilter]);

  const handleShowAll = useCallback(() => {
    setHiddenTypes([]);
    applyFilter(allNodes, allEdges, []);
  }, [allNodes, allEdges, applyFilter]);

  const handleHideAll = useCallback(() => {
    const allTypes = ['condition', 'intervention', 'careDomain', 'scripture', 'egwReference', 'recipe', 'evidenceEntry', 'reference'];
    setHiddenTypes(allTypes);
    applyFilter(allNodes, allEdges, allTypes);
  }, [allNodes, allEdges, applyFilter]);

  // Handle search node selection
  const handleSelectNode = useCallback((node) => {
    setHighlightedNodeId(node.id);

    // Center view on selected node
    const targetNode = nodes.find((n) => n.id === node.id);
    if (targetNode?.position) {
      setCenter(
        targetNode.position.x + 90, // Center on node (accounting for node width)
        targetNode.position.y + 40, // Center on node (accounting for node height)
        { zoom: 1.2, duration: 800 }
      );
    }

    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedNodeId(null), 3000);
  }, [nodes, setCenter]);

  const handleClearSearch = useCallback(() => {
    setHighlightedNodeId(null);
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Re-apply layout when layout type changes
  const handleLayoutChange = useCallback(
    (newLayout) => {
      setLayoutType(newLayout);
      if (allNodes.length > 0) {
        const layoutedNodes = applyLayout(allNodes, allEdges, newLayout);
        setAllNodes(layoutedNodes);
        applyFilter(layoutedNodes, allEdges, hiddenTypes);
      }
    },
    [allNodes, allEdges, hiddenTypes, applyFilter]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onLayoutChange: handleLayoutChange,
    graphTitle: `${centerType}-graph`,
  });

  // Handle node click - open details panel
  const handleNodeClick = useCallback(
    (event, node) => {
      // Don't open panel for group nodes
      if (node.type === 'group') return;
      setSelectedNode(node);
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Handle node hover for edge highlighting
  const handleNodeMouseEnter = useCallback((event, node) => {
    if (node.type !== 'group') {
      setHoveredNodeId(node.id);
    }
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Close details panel
  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Navigate to entity detail page
  const handleNavigateToEntity = useCallback((type, entityId) => {
    const routes = {
      condition: `/conditions/${entityId}`,
      intervention: `/interventions/${entityId}`,
      recipe: `/recipes/${entityId}`,
      scripture: `/scriptures/${entityId}`,
      egwReference: `/egw-references/${entityId}`,
    };
    if (routes[type]) {
      window.location.href = routes[type];
    }
  }, []);

  // Node color map for minimap
  const nodeColor = useCallback((node) => {
    return node.data?.color || '#666';
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full w-full overflow-hidden bg-gray-50 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full w-full overflow-hidden bg-gray-50 ${className}`}>
        <div className="text-center text-red-600">
          <p className="font-medium">Error loading graph</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchGraphData}
            className="mt-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Add highlight state to nodes and determine connected edges
  const connectedEdgeIds = new Set();
  if (hoveredNodeId) {
    edges.forEach((edge) => {
      if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
        connectedEdgeIds.add(edge.id);
      }
    });
  }

  const displayNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isHighlighted: node.id === highlightedNodeId,
      isConnected: hoveredNodeId ? (node.id === hoveredNodeId || connectedEdgeIds.size > 0 && edges.some(e =>
        (e.source === hoveredNodeId && e.target === node.id) ||
        (e.target === hoveredNodeId && e.source === node.id)
      )) : true,
    },
    style: {
      ...node.style,
      opacity: hoveredNodeId && node.id !== hoveredNodeId && !edges.some(e =>
        (e.source === hoveredNodeId && e.target === node.id) ||
        (e.target === hoveredNodeId && e.source === node.id)
      ) ? 0.3 : 1,
      transition: 'opacity 0.2s ease',
    },
  }));

  // Highlight connected edges
  const displayEdges = edges.map((edge) => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: hoveredNodeId ? (connectedEdgeIds.has(edge.id) ? 1 : 0.1) : (edge.style?.opacity || 1),
      strokeWidth: connectedEdgeIds.has(edge.id) ? (edge.style?.strokeWidth || 2) + 1 : edge.style?.strokeWidth,
      transition: 'opacity 0.2s ease, stroke-width 0.2s ease',
    },
  }));

  return (
    <div className={`h-full w-full overflow-hidden ${className}`}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls showInteractive={false} />
        {showUI && (
          <MiniMap
            nodeColor={nodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-white !border !border-gray-200 !rounded-lg !shadow-md"
          />
        )}

        {/* Back Button and UI Toggle - Always visible */}
        <Panel position="top-left" className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {backButton}
            <button
              onClick={() => setShowUI(!showUI)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              title={showUI ? 'Hide UI (show only graph)' : 'Show UI'}
            >
              {showUI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{showUI ? 'Hide UI' : 'Show UI'}</span>
            </button>
          </div>

          {/* Search and Filter Panel - Conditional */}
          {showUI && (
            <>
              <SearchBar
                nodes={allNodes}
                onSelectNode={handleSelectNode}
                onClearSearch={handleClearSearch}
              />
              <FilterPanel
                hiddenTypes={hiddenTypes}
                onToggleType={handleToggleType}
                onShowAll={handleShowAll}
                onHideAll={handleHideAll}
              />
            </>
          )}
        </Panel>

        {/* Control Panel - Conditional */}
        {showUI && (
          <Panel position="top-right" className="flex flex-col gap-2">
            {/* Layout Selector */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Layout</span>
              </div>
              <select
                value={layoutType}
                onChange={(e) => handleLayoutChange(e.target.value)}
                className="text-xs w-full px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {layoutOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Depth Selector */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2">
              <div className="flex items-center gap-2 mb-2">
                <Maximize2 className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Depth: {depth}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
              </div>
            </div>

            {/* Reset Layout Button */}
            <button
              onClick={() => {
                clearSavedPositions();
                fetchGraphData();
              }}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Reset to default layout"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Layout</span>
            </button>

            {/* Stats */}
            {meta && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2 text-xs text-gray-600">
                <div>Nodes: {nodes.length}{nodes.length !== meta.totalNodes ? ` / ${meta.totalNodes}` : ''}</div>
                <div>Edges: {edges.length}{edges.length !== meta.totalEdges ? ` / ${meta.totalEdges}` : ''}</div>
              </div>
            )}

            {/* Export */}
            <ExportPanel graphTitle={`${centerType}-${centerId}`} />

            {/* Keyboard Shortcuts */}
            <KeyboardShortcutsHelp />
          </Panel>
        )}

        {/* Legend - Conditional */}
        {showUI && (
          <Panel position="bottom-right" className="!mb-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                  <span>Condition</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
                  <span>Intervention</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div>
                  <span>Care Domain</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></div>
                  <span>Scripture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div>
                  <span>EGW Reference</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
                  <span>Recipe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                  <span>Evidence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></div>
                  <span>Reference</span>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Node Details Panel */}
      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onClose={handleCloseDetails}
          onNavigate={handleNavigateToEntity}
        />
      )}
    </div>
  );
};

// Wrap with ReactFlowProvider for useReactFlow hook
const KnowledgeGraph = (props) => (
  <ReactFlowProvider>
    <KnowledgeGraphInner {...props} />
  </ReactFlowProvider>
);

export default KnowledgeGraph;
