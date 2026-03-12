import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { AlertCircle, Clock, ShieldCheck, ExternalLink } from 'lucide-react';

const LIKELIHOOD_LABELS = {
  common: 'Common',
  occasional: 'Occasional',
  rare: 'Rare',
};

/**
 * Mindmap node representing a medical complication of the center condition.
 * Displays complication name, likelihood label (common/occasional/rare),
 * and metadata badges for timeframe, preventability, and linked conditions.
 * Color-coded by likelihood severity. Target handle on top for connections
 * from the complications branch.
 *
 * @param {Object} props - React Flow node props
 * @param {Object} props.data - Node data: name, color, likelihood, timeframe, preventable, linkedConditionId
 * @param {boolean} props.selected - Whether the node is selected
 */
const ComplicationNode = memo(({ data, selected }) => {
  const color = data.color || data.likelihoodColor || '#dc2626';

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg shadow-md border-2 transition-all duration-200
        bg-white min-w-[140px] max-w-[180px]
        ${selected ? 'shadow-lg scale-105' : 'hover:shadow-lg hover:scale-102'}
      `}
      style={{ borderColor: color }}
    >
      {/* Connection handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2"
        style={{ background: color }}
      />

      {/* Content */}
      <div className="flex items-start gap-2">
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <AlertCircle className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-xs text-gray-800 leading-tight">
            {data.name}
          </div>
          {data.likelihood && (
            <div
              className="mt-1 text-[10px] font-medium"
              style={{ color }}
            >
              {LIKELIHOOD_LABELS[data.likelihood] || data.likelihood}
            </div>
          )}
        </div>
      </div>

      {/* Metadata badges */}
      <div className="mt-2 pt-1.5 border-t border-gray-100 flex flex-wrap gap-1">
        {data.timeframe && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600">
            <Clock className="w-2.5 h-2.5" />
            {data.timeframe}
          </span>
        )}
        {data.preventable && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-50 text-green-700">
            <ShieldCheck className="w-2.5 h-2.5" />
            Preventable
          </span>
        )}
        {data.linkedConditionId && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700">
            <ExternalLink className="w-2.5 h-2.5" />
            Linked
          </span>
        )}
      </div>
    </div>
  );
});

ComplicationNode.displayName = 'ComplicationNode';

export default ComplicationNode;
