import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { BookMarked } from 'lucide-react';

const EgwReferenceNode = memo(({ data, selected }) => {
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-purple-50
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse' : ''}
        ${selected ? 'shadow-xl scale-105 border-purple-400' : 'border-purple-200 hover:border-purple-300 hover:shadow-xl'}
      `}
      style={{ minWidth: '150px', maxWidth: '200px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md flex-shrink-0">
          <BookMarked className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide mb-0.5">
            EGW Reference
          </div>
          <div
            className="font-bold text-sm text-gray-900 leading-tight line-clamp-2"
            title={data.label}
          >
            {data.label}
          </div>
        </div>
      </div>

      {/* Topic & Book */}
      <div className="mt-2 pt-2 border-t border-purple-100 flex flex-wrap gap-1">
        {data.topic && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
            {data.topic}
          </span>
        )}
        {data.book && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
            {data.book.length > 15 ? data.book.substring(0, 15) + '...' : data.book}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white"
      />
    </div>
  );
});

EgwReferenceNode.displayName = 'EgwReferenceNode';

export default EgwReferenceNode;
