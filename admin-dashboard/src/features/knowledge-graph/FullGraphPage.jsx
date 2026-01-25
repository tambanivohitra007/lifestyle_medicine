import { useCallback, useEffect, useState, useMemo } from 'react';
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
import { Link } from 'react-router-dom';
import { Loader2, Layout, ChevronLeft, ChevronRight, BarChart3, Eye, EyeOff } from 'lucide-react';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { applyLayout, layoutOptions } from './utils/layoutEngine';
import { FilterPanel, SearchBar, ExportPanel, KeyboardShortcutsHelp } from './controls';
import { useKeyboardShortcuts } from './hooks';
import api from '../../lib/api';

const FullGraphInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layoutType, setLayoutType] = useState('cluster');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const { fitView, setCenter } = useReactFlow();

  const limit = 50;

  // Fetch graph data
  const fetchGraphData = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/knowledge-graph/full?page=${pageNum}&limit=${limit}`);
      const { nodes: apiNodes, edges: apiEdges, meta: apiMeta } = response.data;

      // Ensure all edges use step path by setting type
      const processedEdges = apiEdges.map(edge => ({
        ...edge,
        type: edge.type || 'smoothstep',
      }));

      // Apply layout
      const layoutedNodes = applyLayout(apiNodes, processedEdges, layoutType);

      if (pageNum === 1) {
        setAllNodes(layoutedNodes);
        setAllEdges(processedEdges);
      } else {
        // Append for lazy loading
        setAllNodes((prev) => [...prev, ...layoutedNodes]);
        setAllEdges((prev) => [...prev, ...processedEdges]);
      }

      setMeta(apiMeta);
    } catch (err) {
      console.error('Failed to fetch knowledge graph:', err);
      setError(err.response?.data?.message || 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  }, [layoutType]);

  useEffect(() => {
    fetchGraphData(1);
  }, []);

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

  // Apply filter when allNodes/allEdges or hiddenTypes change
  useEffect(() => {
    if (allNodes.length > 0) {
      applyFilter(allNodes, allEdges, hiddenTypes);
    }
  }, [allNodes, allEdges, hiddenTypes, applyFilter]);

  // Handle filter toggle
  const handleToggleType = useCallback((type) => {
    setHiddenTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const handleShowAll = useCallback(() => {
    setHiddenTypes([]);
  }, []);

  const handleHideAll = useCallback(() => {
    const allTypes = ['condition', 'intervention', 'careDomain', 'scripture', 'egwReference', 'recipe', 'evidenceEntry', 'reference'];
    setHiddenTypes(allTypes);
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout) => {
    setLayoutType(newLayout);
    if (allNodes.length > 0) {
      const layoutedNodes = applyLayout(allNodes, allEdges, newLayout);
      setAllNodes(layoutedNodes);
    }
  }, [allNodes, allEdges]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onLayoutChange: handleLayoutChange,
    graphTitle: 'full-knowledge-graph',
  });

  // Handle search node selection
  const handleSelectNode = useCallback((node) => {
    setHighlightedNodeId(node.id);

    const targetNode = nodes.find((n) => n.id === node.id);
    if (targetNode?.position) {
      setCenter(
        targetNode.position.x + 90,
        targetNode.position.y + 40,
        { zoom: 1.2, duration: 800 }
      );
    }

    setTimeout(() => setHighlightedNodeId(null), 3000);
  }, [nodes, setCenter]);

  const handleClearSearch = useCallback(() => {
    setHighlightedNodeId(null);
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  // Load more nodes
  const loadMore = useCallback(() => {
    if (meta?.hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGraphData(nextPage);
    }
  }, [meta, loading, page, fetchGraphData]);

  // Node color map for minimap
  const nodeColor = useCallback((node) => node.data?.color || '#666', []);

  // Add highlight state to nodes
  const displayNodes = useMemo(() =>
    nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: node.id === highlightedNodeId,
      },
    })),
    [nodes, highlightedNodeId]
  );

  if (loading && allNodes.length === 0) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading full knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-medium">Error loading graph</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => fetchGraphData(1)}
            className="mt-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <div className="h-full w-full">
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.05}
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
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
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

              {/* Stats */}
              {meta && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Statistics</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Visible Nodes:</span>
                      <span className="font-medium">{nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Visible Edges:</span>
                      <span className="font-medium">{edges.length}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Total in DB:</span>
                        <span>{meta.totalNodes}</span>
                      </div>
                    </div>
                  </div>
                  {meta.stats && (
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5 text-[10px]">
                      {Object.entries(meta.stats).map(([type, count]) => (
                        count > 0 && (
                          <div key={type} className="flex justify-between text-gray-500">
                            <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span>{count}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Export */}
              <ExportPanel graphTitle="full-knowledge-graph" />

              {/* Keyboard Shortcuts */}
              <KeyboardShortcutsHelp />

              {/* Pagination */}
              {meta?.hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Load More</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
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
      </div>
    </div>
  );
};

const FullGraphPage = () => (
  <ReactFlowProvider>
    <FullGraphInner />
  </ReactFlowProvider>
);

export default FullGraphPage;
