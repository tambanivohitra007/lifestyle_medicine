import { useState, useCallback } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';
import { Download, Image, FileCode, Copy, Check, Share2, ChevronDown, Printer, Loader2 } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';

const QUALITY_OPTIONS = [
  { label: 'Standard (2x)', value: 2, description: 'Good for web sharing' },
  { label: 'High (4x)', value: 4, description: 'Best for presentations' },
  { label: 'Print (6x)', value: 6, description: 'Best for printing' },
];

const ExportPanel = ({ graphTitle = 'Knowledge Graph' }) => {
  const { getNodes } = useReactFlow();
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'png', 'svg', 'print'
  const [copied, setCopied] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const downloadImage = useCallback(async (type = 'png', pixelRatio = 2) => {
    setExporting(true);
    setExportType(type);

    try {
      const nodes = getNodes();
      if (nodes.length === 0) {
        alert('No nodes to export');
        setExporting(false);
        setExportType(null);
        return;
      }

      // Get the viewport element that contains the actual graph
      const viewportElement = document.querySelector('.react-flow__viewport');
      if (!viewportElement) {
        alert('Could not find graph viewport');
        setExporting(false);
        setExportType(null);
        return;
      }

      // Calculate bounds of all nodes
      const nodesBounds = getNodesBounds(nodes);

      // Add padding
      const padding = 100;
      const imageWidth = nodesBounds.width + padding * 2;
      const imageHeight = nodesBounds.height + padding * 2;

      // Get the viewport transform needed to show all nodes
      const viewport = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5,  // minZoom
        2,    // maxZoom
        padding
      );

      const options = {
        backgroundColor: '#f9fafb',
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      };

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${graphTitle.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

      let dataUrl;
      if (type === 'svg') {
        dataUrl = await toSvg(viewportElement, options);
        downloadFile(dataUrl, `${filename}.svg`);
      } else if (type === 'print') {
        // Generate high-res PNG and open in new window for printing
        dataUrl = await toPng(viewportElement, { ...options, pixelRatio: 4 });
        openPrintWindow(dataUrl, graphTitle);
      } else {
        const qualitySuffix = pixelRatio > 2 ? `-${pixelRatio}x` : '';
        dataUrl = await toPng(viewportElement, { ...options, pixelRatio });
        downloadFile(dataUrl, `${filename}${qualitySuffix}.png`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image: ' + error.message);
    } finally {
      setExporting(false);
      setExportType(null);
      setShowQualityMenu(false);
    }
  }, [getNodes, graphTitle]);

  const downloadFile = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const openPrintWindow = (dataUrl, title) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                img { max-width: 100%; height: auto; page-break-inside: avoid; }
              }
              body {
                margin: 20px;
                font-family: system-ui, -apple-system, sans-serif;
              }
              h1 { font-size: 18px; margin-bottom: 10px; color: #333; }
              img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; }
              .print-hint {
                margin-top: 10px;
                font-size: 12px;
                color: #666;
              }
              @media print {
                .print-hint { display: none; }
                h1 { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <img src="${dataUrl}" alt="${title}" />
            <p class="print-hint">Press Ctrl+P (or Cmd+P) to print or save as PDF</p>
            <script>
              window.onload = function() {
                setTimeout(function() { window.print(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
        {/* PNG Export with Quality Options */}
        <div className="relative">
          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            disabled={exporting}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            {exportType === 'png' ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <Image className="w-4 h-4 text-blue-500" />
            )}
            <span className="flex-1">Download PNG</span>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showQualityMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Quality dropdown */}
          {showQualityMenu && !exporting && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => downloadImage('png', option.value)}
                  className="w-full flex flex-col items-start px-3 py-2 text-xs hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-700">{option.label}</span>
                  <span className="text-[10px] text-gray-400">{option.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SVG Export */}
        <button
          onClick={() => downloadImage('svg')}
          disabled={exporting}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          {exportType === 'svg' ? (
            <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
          ) : (
            <FileCode className="w-4 h-4 text-green-500" />
          )}
          <span className="flex-1">Download SVG</span>
          <span className="text-[10px] text-gray-400">vector</span>
        </button>

        {/* Print / PDF Export */}
        <button
          onClick={() => downloadImage('print')}
          disabled={exporting}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          {exportType === 'print' ? (
            <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
          ) : (
            <Printer className="w-4 h-4 text-orange-500" />
          )}
          <span className="flex-1">Print / PDF</span>
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
          Tip: Use Ctrl+S to quick save PNG
        </p>
      </div>
    </div>
  );
};

export default ExportPanel;
