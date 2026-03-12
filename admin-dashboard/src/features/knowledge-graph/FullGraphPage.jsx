import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Markmap, deriveOptions } from 'markmap-view';
import {
    Loader2,
    ChevronLeft,
    BarChart3,
    Search,
    X,
    ZoomIn,
    ZoomOut,
    Maximize,
    Download,
    Expand,
    Shrink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';

const NODE_COLORS = {
    condition: '#ef4444',
    intervention: '#f43f5e',
    careDomain: '#3b82f6',
    scripture: '#6366f1',
    egwReference: '#8b5cf6',
    recipe: '#f59e0b',
    evidenceEntry: '#10b981',
    reference: '#64748b',
};

const MARKMAP_OPTIONS = {
    colorFreezeLevel: 2,
    duration: 400,
    maxWidth: 350,
    initialExpandLevel: 2,
    spacingHorizontal: 100,
    spacingVertical: 6,
    zoom: true,
    pan: true,
    fitRatio: 0.92,
    paddingX: 12,
};

/**
 * Full knowledge graph visualization using markmap — a hierarchical mindmap
 * that organizes conditions, interventions, care domains, scriptures, recipes,
 * and EGW references into a navigable tree.
 */
const FullGraphPage = () => {
    const { t } = useTranslation(['knowledgeGraph']);
    const svgRef = useRef(null);
    const markmapRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [treeData, setTreeData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandLevel, setExpandLevel] = useState(2);
    const [, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);

    // Fetch tree data from backend
    const fetchTreeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/knowledge-graph/tree');
            setTreeData(response.data.tree);
            setStats(response.data.stats);
        } catch (err) {
            console.error('Failed to fetch knowledge graph tree:', err);
            setError(
                err.response?.data?.message || 'Failed to load knowledge graph',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTreeData();
    }, [fetchTreeData]);

    // Initialize markmap
    useEffect(() => {
        if (!svgRef.current || !treeData) return;

        if (!markmapRef.current) {
            const options = deriveOptions(MARKMAP_OPTIONS);
            markmapRef.current = Markmap.create(svgRef.current, options);
        }

        markmapRef.current.setData(treeData);
        markmapRef.current.fit();

        return () => {
            // Cleanup on unmount only
        };
    }, [treeData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            markmapRef.current?.destroy();
            markmapRef.current = null;
        };
    }, []);

    // Flatten tree nodes for search
    const flatNodes = useMemo(() => {
        if (!treeData) return [];
        const nodes = [];
        const walk = (node, path = []) => {
            // Strip HTML to get plain text
            const text = node.content?.replace(/<[^>]*>/g, '') || '';
            nodes.push({ text, node, path: [...path, text] });
            if (node.children) {
                node.children.forEach((child) => walk(child, [...path, text]));
            }
        };
        walk(treeData);
        return nodes;
    }, [treeData]);

    // Search results
    const searchResults = useMemo(() => {
        if (searchQuery.length < 2) return [];
        const q = searchQuery.toLowerCase();
        return flatNodes
            .filter((n) => n.text.toLowerCase().includes(q))
            .slice(0, 15);
    }, [flatNodes, searchQuery]);

    // Handle zoom controls
    const handleZoomIn = useCallback(() => {
        markmapRef.current?.rescale(1.3);
    }, []);

    const handleZoomOut = useCallback(() => {
        markmapRef.current?.rescale(0.7);
    }, []);

    const handleFitView = useCallback(() => {
        markmapRef.current?.fit();
    }, []);

    // Handle expand level change
    const handleExpandMore = useCallback(() => {
        const newLevel = Math.min(expandLevel + 1, 6);
        setExpandLevel(newLevel);
        if (markmapRef.current) {
            const options = deriveOptions({
                ...MARKMAP_OPTIONS,
                initialExpandLevel: newLevel,
            });
            markmapRef.current.setOptions(options);
            markmapRef.current.setData(treeData);
            markmapRef.current.fit();
        }
    }, [expandLevel, treeData]);

    const handleExpandLess = useCallback(() => {
        const newLevel = Math.max(expandLevel - 1, 1);
        setExpandLevel(newLevel);
        if (markmapRef.current) {
            const options = deriveOptions({
                ...MARKMAP_OPTIONS,
                initialExpandLevel: newLevel,
            });
            markmapRef.current.setOptions(options);
            markmapRef.current.setData(treeData);
            markmapRef.current.fit();
        }
    }, [expandLevel, treeData]);

    // Export as SVG
    const handleExportSvg = useCallback(() => {
        if (!svgRef.current) return;
        const svgEl = svgRef.current;
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgEl);
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowledge-graph.svg';
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Listen for fullscreen change
    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
            // Refit after fullscreen change
            setTimeout(() => markmapRef.current?.fit(), 300);
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    if (loading) {
        return (
            <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                        {t('knowledgeGraph:loading.title')}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p className="font-medium">
                        {t('knowledgeGraph:error.title')}
                    </p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={fetchTreeData}
                        className="mt-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    >
                        {t('knowledgeGraph:error.retry')}
                    </button>
                </div>
            </div>
        );
    }

    const totalEntities = stats
        ? Object.values(stats).reduce((a, b) => a + b, 0)
        : 0;

    return (
        <div
            ref={containerRef}
            className="h-screen overflow-hidden bg-gray-50 flex flex-col"
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            {t('knowledgeGraph:controls.backToDashboard', {
                                defaultValue: 'Dashboard',
                            })}
                        </span>
                    </Link>
                    <div className="hidden sm:block h-5 w-px bg-gray-300" />
                    <h1 className="hidden sm:block text-sm font-semibold text-gray-800">
                        {t('knowledgeGraph:title')}
                    </h1>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs mx-4">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('knowledgeGraph:search.placeholder')}
                        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                            <ul className="max-h-64 overflow-y-auto">
                                {searchResults.map((result, i) => (
                                    <li key={i}>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                // Highlight by scrolling — markmap doesn't have native search,
                                                // but we can try to find and center on the node
                                                if (markmapRef.current) {
                                                    markmapRef.current.fit();
                                                }
                                            }}
                                            className="w-full flex flex-col px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-medium text-gray-800 truncate">
                                                {result.text}
                                            </span>
                                            <span className="text-[10px] text-gray-400 truncate">
                                                {result.path.slice(0, -1).join(' > ')}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {searchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
                            <p className="text-xs text-gray-500 text-center">
                                {t('knowledgeGraph:search.noResults')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleExpandLess}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Collapse more"
                    >
                        <Shrink className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500 min-w-[3ch] text-center">
                        L{expandLevel}
                    </span>
                    <button
                        onClick={handleExpandMore}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Expand more"
                    >
                        <Expand className="w-4 h-4" />
                    </button>
                    <div className="h-5 w-px bg-gray-300 mx-1" />
                    <button
                        onClick={handleZoomOut}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Zoom out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleZoomIn}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Zoom in"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleFitView}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Fit to view"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                    <div className="h-5 w-px bg-gray-300 mx-1" />
                    <button
                        onClick={handleExportSvg}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Export SVG"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Toggle fullscreen"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Markmap SVG */}
            <div className="flex-1 relative">
                <svg
                    ref={svgRef}
                    className="w-full h-full"
                    style={{ background: '#fafafa' }}
                />

                {/* Stats Overlay */}
                {stats && (
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-md border border-gray-200 p-3 text-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-medium text-gray-700">
                                {totalEntities} entities
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-500">
                            {Object.entries(stats).map(
                                ([type, count]) =>
                                    count > 0 && (
                                        <div
                                            key={type}
                                            className="flex items-center gap-1.5"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        NODE_COLORS[
                                                            type.replace(
                                                                /s$/,
                                                                '',
                                                            )
                                                        ] ||
                                                        NODE_COLORS[type] ||
                                                        '#6b7280',
                                                }}
                                            />
                                            <span>
                                                {type
                                                    .replace(
                                                        /([A-Z])/g,
                                                        ' $1',
                                                    )
                                                    .trim()}
                                                : {count}
                                            </span>
                                        </div>
                                    ),
                            )}
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-md border border-gray-200 p-2.5 text-[10px]">
                    <div className="text-gray-500 font-medium mb-1">
                        Click nodes to expand/collapse
                    </div>
                    <div className="text-gray-400">
                        Scroll to zoom, drag to pan
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullGraphPage;
