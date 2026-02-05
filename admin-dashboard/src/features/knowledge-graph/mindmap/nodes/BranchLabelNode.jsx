import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react';

const ICONS = {
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'lightbulb': Lightbulb,
};

/**
 * Branch label node - marks the start of a major branch
 */
const BranchLabelNode = memo(({ data, selected }) => {
  const Icon = ICONS[data.icon] || Lightbulb;
  const color = data.color || '#6b7280';

  return (
    <div
      className={`
        relative px-4 py-2.5 rounded-full shadow-lg border-2 transition-all duration-200
        bg-white
        ${selected ? 'shadow-xl scale-105' : 'hover:shadow-xl hover:scale-102'}
      `}
      style={{ borderColor: color }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="target"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2 !h-2"
        style={{ background: color }}
      />

      {/* Content */}
      <div className="flex items-center gap-2">
        <div
          className="p-1.5 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color }}>
            {data.label}
          </div>
        </div>
        {data.count > 0 && (
          <span
            className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {data.count}
          </span>
        )}
      </div>
    </div>
  );
});

BranchLabelNode.displayName = 'BranchLabelNode';

export default BranchLabelNode;
