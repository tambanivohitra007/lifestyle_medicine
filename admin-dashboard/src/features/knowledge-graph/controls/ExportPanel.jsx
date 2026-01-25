import { useState, useCallback } from 'react';
import { useReactFlow, getRectOfNodes } from 'reactflow';
import { Download, Image, FileCode, Copy, Check, Share2 } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';

const ExportPanel = ({ graphTitle = 'Knowledge Graph' }) => {
  const { getNodes, getViewport } = useReactFlow();
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadImage = useCallback(async (type = 'png') => {
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    setExporting(true);

    try {
      const nodes = getNodes();
      if (nodes.length === 0) {
        alert('No nodes to export');
        return;
      }

      // Get the bounds of all nodes
      const nodesBounds = getRectOfNodes(nodes);

      // Add padding
      const padding = 50;
      const width = nodesBounds.width + padding * 2;
      const height = nodesBounds.height + padding * 2;

      const options = {
        backgroundColor: '#f9fafb',
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${-nodesBounds.x + padding}px, ${-nodesBounds.y + padding}px)`,
        },
        filter: (node) => {
          // Filter out minimap and controls
          if (node.classList) {
            return (
              !node.classList.contains('react-flow__minimap') &&
              !node.classList.contains('react-flow__controls') &&
              !node.classList.contains('react-flow__panel')
            );
          }
          return true;
        },
      };

      let dataUrl;
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${graphTitle.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

      if (type === 'svg') {
        dataUrl = await toSvg(flowElement, options);
        downloadFile(dataUrl, `${filename}.svg`);
      } else {
        dataUrl = await toPng(flowElement, { ...options, pixelRatio: 2 });
        downloadFile(dataUrl, `${filename}.png`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [getNodes, graphTitle]);

  const downloadFile = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const copyShareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Download className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">Export</span>
      </div>

      <div className="space-y-2">
        {/* PNG Export */}
        <button
          onClick={() => downloadImage('png')}
          disabled={exporting}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          <Image className="w-4 h-4 text-blue-500" />
          <span className="flex-1">Download PNG</span>
          {exporting && <span className="text-gray-400">...</span>}
        </button>

        {/* SVG Export */}
        <button
          onClick={() => downloadImage('svg')}
          disabled={exporting}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          <FileCode className="w-4 h-4 text-green-500" />
          <span className="flex-1">Download SVG</span>
          {exporting && <span className="text-gray-400">...</span>}
        </button>

        {/* Share Link */}
        <button
          onClick={copyShareLink}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="flex-1 text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-purple-500" />
              <span className="flex-1">Copy Link</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          Tip: Use Ctrl+S to save PNG
        </p>
      </div>
    </div>
  );
};

export default ExportPanel;
