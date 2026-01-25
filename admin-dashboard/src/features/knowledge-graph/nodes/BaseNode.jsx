import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const BaseNode = memo(({ data, icon: Icon, selected }) => {
  const isCenter = data.isCenter;

  return (
    <div
      className={`
        px-3 py-2 rounded-lg shadow-md border-2 transition-all
        ${isCenter ? 'ring-4 ring-offset-2' : ''}
        ${selected ? 'shadow-lg scale-105' : ''}
      `}
      style={{
        backgroundColor: 'white',
        borderColor: data.color,
        minWidth: '140px',
        maxWidth: '200px',
        ringColor: isCenter ? data.color : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2"
        style={{ background: data.color }}
      />

      <div className="flex items-center gap-2">
        {Icon && (
          <div
            className="p-1.5 rounded-md flex-shrink-0"
            style={{ backgroundColor: `${data.color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: data.color }} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="font-semibold text-xs truncate"
            style={{ color: data.color }}
            title={data.label}
          >
            {data.label}
          </div>
          {data.subtitle && (
            <div className="text-[10px] text-gray-500 truncate" title={data.subtitle}>
              {data.subtitle}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2"
        style={{ background: data.color }}
      />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;
