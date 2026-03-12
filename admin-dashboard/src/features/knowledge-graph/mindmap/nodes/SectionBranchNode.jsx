import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  AlertTriangle,
  AlertCircle,
  Activity,
  HeartPulse,
  PlusCircle,
  BookOpen,
  Lightbulb,
  FileText,
} from 'lucide-react';

const ICONS = {
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'activity': Activity,
  'heart-pulse': HeartPulse,
  'plus-circle': PlusCircle,
  'book-open': BookOpen,
  'lightbulb': Lightbulb,
  'file-text': FileText,
};

/**
 * Section branch node -- a pill-shaped connector that marks the start of a
 * condition section branch (Risk Factors, Complications, Physiology, etc.).
 * Displays a section icon, label, and item count badge. Acts as the
 * intermediate node between the center condition and individual section items.
 * Has handles on left (target), top/bottom/right (sources) for flexible routing.
 *
 * @param {Object} props - React Flow node props
 * @param {Object} props.data - Node data: label, count, color, icon (lucide icon key)
 * @param {boolean} props.selected - Whether the node is selected
 */
const SectionBranchNode = memo(({ data, selected }) => {
  const Icon = ICONS[data.icon] || FileText;
  const color = data.color || '#6b7280';

  return (
    <div
      className={`
        relative px-4 py-2.5 rounded-full shadow-lg border-2 transition-all duration-200
        bg-white cursor-pointer
        ${selected ? 'shadow-xl scale-105' : 'hover:shadow-xl hover:scale-102'}
      `}
      style={{ borderColor: color }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
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
        position={Position.Bottom}
        id="source-bottom"
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

SectionBranchNode.displayName = 'SectionBranchNode';

export default SectionBranchNode;
