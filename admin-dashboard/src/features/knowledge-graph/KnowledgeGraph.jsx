import { useCallback, useEffect, useState, useRef } from 'react';
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
import { Loader2, Layout, Maximize2 } from 'lucide-react';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { applyLayout, layoutOptions } from './utils/layoutEngine';
import { FilterPanel, SearchBar } from './controls';
import api from '../../lib/api';

const KnowledgeGraphInner = ({
  centerType = 'condition',
  centerId,
  initialDepth = 2,
  onNodeClick,
  className = '',
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [allNodes, setAllNodes] = useState([]); // Store original unfiltered nodes
  const [allEdges, setAllEdges] = useState([]); // Store original unfiltered edges
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [depth, setDepth] = useState(initialDepth);
  const [layoutType, setLayoutType] = useState('dagre-tb');
  const [meta, setMeta] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const { fitView, setCenter } = useReactFlow();

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    if (!centerId) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = `/knowledge-graph/${centerType}/${centerId}?depth=${depth}`;
      const response = await api.get(endpoint);
      const { nodes: apiNodes, edges: apiEdges, meta: apiMeta } = response.data;

      // Apply layout
      const layoutedNodes = applyLayout(apiNodes, apiEdges, layoutType);

      // Store original data for filtering
      setAllNodes(layoutedNodes);
      setAllEdges(apiEdges);

      // Apply current filter
      applyFilter(layoutedNodes, apiEdges, hiddenTypes);
      setMeta(apiMeta);
    } catch (err) {
      console.error('Failed to fetch knowledge graph:', err);
      setError(err.response?.data?.message || 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  }, [centerId, centerType, depth, layoutType]);

  // Apply filter to nodes and edges
  const applyFilter = useCallback((nodeList, edgeList, hidden) => {
    const visibleNodeIds = new Set(
      nodeList
        .filter((node) => !hidden.includes(node.type))
        .map((node) => node.id)
    );

    const filteredNodes = nodeList.filter((node) => visibleNodeIds.has(node.id));
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

  // Handle node click
  const handleNodeClick = useCallback(
    (event, node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Node color map for minimap
  const nodeColor = useCallback((node) => {
    return node.data?.color || '#666';
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
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

  // Add highlight state to nodes
  const displayNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isHighlighted: node.id === highlightedNodeId,
    },
  }));

  return (
    <div className={`h-full ${className}`}>
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
        }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-md"
        />

        {/* Search and Filter Panel */}
        <Panel position="top-left" className="flex flex-col gap-2">
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
        </Panel>

        {/* Control Panel */}
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

          {/* Stats */}
          {meta && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2 text-xs text-gray-600">
              <div>Nodes: {nodes.length}{nodes.length !== meta.totalNodes ? ` / ${meta.totalNodes}` : ''}</div>
              <div>Edges: {edges.length}{edges.length !== meta.totalEdges ? ` / ${meta.totalEdges}` : ''}</div>
            </div>
          )}
        </Panel>

        {/* Legend */}
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
      </ReactFlow>
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
