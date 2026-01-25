import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Shield } from 'lucide-react';

const CareDomainNode = memo(({ data, selected }) => {
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-blue-50
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse' : ''}
        ${selected ? 'shadow-xl scale-105 border-blue-400' : 'border-blue-200 hover:border-blue-300 hover:shadow-xl'}
      `}
      style={{ minWidth: '140px', maxWidth: '180px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-0.5">
            Care Domain
          </div>
          <div
            className="font-bold text-sm text-gray-900 leading-tight line-clamp-2"
            title={data.label}
          >
            {data.label}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white"
      />
    </div>
  );
});

CareDomainNode.displayName = 'CareDomainNode';

export default CareDomainNode;
