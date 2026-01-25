import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ExternalLink, FileText } from 'lucide-react';

const ReferenceNode = memo(({ data, selected }) => {
  const hasLink = data.doi || data.pmid || data.url;

  return (
    <div
      className={`
        group relative px-3 py-2.5 rounded-lg shadow-md border-2 transition-all duration-200
        bg-gradient-to-br from-white to-slate-50
        ${selected ? 'shadow-xl scale-105 border-slate-400' : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'}
      `}
      style={{ minWidth: '120px', maxWidth: '160px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-gradient-to-br from-slate-500 to-slate-600 shadow-sm flex-shrink-0">
          {hasLink ? (
            <ExternalLink className="w-3 h-3 text-white" />
          ) : (
            <FileText className="w-3 h-3 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
            Reference
          </div>
          {data.year && (
            <div className="font-bold text-xs text-gray-900">
              {data.year}
            </div>
          )}
        </div>
      </div>

      {/* Citation preview */}
      {data.citation && (
        <div
          className="mt-1.5 text-[9px] text-gray-500 line-clamp-2 leading-relaxed"
          title={data.citation}
        >
          {data.citation.substring(0, 80)}...
        </div>
      )}

      {/* Links indicators */}
      {hasLink && (
        <div className="mt-1.5 flex gap-1">
          {data.doi && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-600">
              DOI
            </span>
          )}
          {data.pmid && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-green-100 text-green-600">
              PMID
            </span>
          )}
          {data.url && !data.doi && !data.pmid && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-gray-100 text-gray-600">
              URL
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
});

ReferenceNode.displayName = 'ReferenceNode';

export default ReferenceNode;
