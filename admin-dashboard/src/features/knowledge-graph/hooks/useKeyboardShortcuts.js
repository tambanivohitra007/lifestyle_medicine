import { useEffect, useCallback } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';
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
 * - R: Radial layout
 * - H: Hierarchical layout
 * - C: Cluster layout
 */
export function useKeyboardShortcuts({
  onLayoutChange,
  onExport,
  graphTitle = 'knowledge-graph',
}) {
  const { fitView, zoomIn, zoomOut, setNodes, getNodes } = useReactFlow();

  const handleExport = useCallback(async () => {
    try {
      const nodes = getNodes();
      if (nodes.length === 0) return;

      const viewportElement = document.querySelector('.react-flow__viewport');
      if (!viewportElement) return;

      const nodesBounds = getNodesBounds(nodes);
      const padding = 100;
      const imageWidth = nodesBounds.width + padding * 2;
      const imageHeight = nodesBounds.height + padding * 2;

      const viewport = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5,
        2,
        padding
      );

      const dataUrl = await toPng(viewportElement, {
        backgroundColor: '#f9fafb',
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 2,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
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
    const isInputFocused = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA';

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

    // Skip single-key shortcuts if input is focused
    if (isInputFocused) return;

    // F: Fit view (without modifier)
    if (event.key === 'f' && !isCtrlOrCmd) {
      fitView({ padding: 0.2, duration: 500 });
      return;
    }

    // R: Radial layout (without modifier)
    if (event.key === 'r' && !isCtrlOrCmd) {
      if (onLayoutChange) onLayoutChange('radial');
      return;
    }

    // H: Hierarchical layout (without modifier)
    if (event.key === 'h' && !isCtrlOrCmd) {
      if (onLayoutChange) onLayoutChange('dagre-tb');
      return;
    }

    // C: Cluster layout (without modifier)
    if (event.key === 'c' && !isCtrlOrCmd) {
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
