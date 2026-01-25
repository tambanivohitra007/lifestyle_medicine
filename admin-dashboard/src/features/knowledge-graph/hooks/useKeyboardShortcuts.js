import { useEffect, useCallback } from 'react';
import { useReactFlow, getRectOfNodes } from 'reactflow';
import { toPng } from 'html-to-image';

/**
 * Hook to handle keyboard shortcuts for the knowledge graph
 *
 * Shortcuts:
 * - Ctrl+S / Cmd+S: Save as PNG
 * - Ctrl+0 / Cmd+0: Reset zoom to fit view
 * - Ctrl+= / Cmd+=: Zoom in
 * - Ctrl+- / Cmd+-: Zoom out
 * - Escape: Clear selection
 * - F: Fit view
 * - R: Reset to radial layout (if provided)
 */
export function useKeyboardShortcuts({
  onLayoutChange,
  onExport,
  graphTitle = 'knowledge-graph',
}) {
  const { fitView, zoomIn, zoomOut, setNodes, getNodes } = useReactFlow();

  const handleExport = useCallback(async () => {
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    try {
      const nodes = getNodes();
      if (nodes.length === 0) return;

      const nodesBounds = getRectOfNodes(nodes);
      const padding = 50;
      const width = nodesBounds.width + padding * 2;
      const height = nodesBounds.height + padding * 2;

      const dataUrl = await toPng(flowElement, {
        backgroundColor: '#f9fafb',
        width,
        height,
        pixelRatio: 2,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${-nodesBounds.x + padding}px, ${-nodesBounds.y + padding}px)`,
        },
        filter: (node) => {
          if (node.classList) {
            return (
              !node.classList.contains('react-flow__minimap') &&
              !node.classList.contains('react-flow__controls') &&
              !node.classList.contains('react-flow__panel')
            );
          }
          return true;
        },
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${graphTitle.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      if (onExport) onExport();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [getNodes, graphTitle, onExport]);

  const handleKeyDown = useCallback((event) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Ctrl+S: Save as PNG
    if (isCtrlOrCmd && event.key === 's') {
      event.preventDefault();
      handleExport();
      return;
    }

    // Ctrl+0: Reset zoom
    if (isCtrlOrCmd && event.key === '0') {
      event.preventDefault();
      fitView({ padding: 0.2, duration: 500 });
      return;
    }

    // Ctrl+=: Zoom in
    if (isCtrlOrCmd && (event.key === '=' || event.key === '+')) {
      event.preventDefault();
      zoomIn({ duration: 200 });
      return;
    }

    // Ctrl+-: Zoom out
    if (isCtrlOrCmd && event.key === '-') {
      event.preventDefault();
      zoomOut({ duration: 200 });
      return;
    }

    // F: Fit view (without modifier)
    if (event.key === 'f' && !isCtrlOrCmd && event.target.tagName !== 'INPUT') {
      fitView({ padding: 0.2, duration: 500 });
      return;
    }

    // R: Radial layout (without modifier)
    if (event.key === 'r' && !isCtrlOrCmd && event.target.tagName !== 'INPUT') {
      if (onLayoutChange) onLayoutChange('radial');
      return;
    }

    // H: Hierarchical layout (without modifier)
    if (event.key === 'h' && !isCtrlOrCmd && event.target.tagName !== 'INPUT') {
      if (onLayoutChange) onLayoutChange('dagre-tb');
      return;
    }

    // C: Cluster layout (without modifier)
    if (event.key === 'c' && !isCtrlOrCmd && event.target.tagName !== 'INPUT') {
      if (onLayoutChange) onLayoutChange('cluster');
      return;
    }

    // Escape: Clear selection
    if (event.key === 'Escape') {
      setNodes((nodes) => nodes.map((node) => ({ ...node, selected: false })));
      return;
    }
  }, [fitView, zoomIn, zoomOut, setNodes, handleExport, onLayoutChange]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleExport };
}

export default useKeyboardShortcuts;
