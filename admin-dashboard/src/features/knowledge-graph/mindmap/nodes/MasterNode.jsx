import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  Activity,
  HeartPulse,
  PlusCircle,
  BookOpen,
  Lightbulb,
  FileText,
  Utensils,
  Dumbbell,
  Droplets,
  Brain,
  Heart,
  Pill,
  Leaf,
} from 'lucide-react';

// Icon mapping for sections
const SECTION_ICONS = {
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'activity': Activity,
  'heart-pulse': HeartPulse,
  'plus-circle': PlusCircle,
  'book-open': BookOpen,
  'lightbulb': Lightbulb,
  'file-text': FileText,
};

// Icon mapping for solution domains
const DOMAIN_ICONS = {
  'utensils': Utensils,
  'dumbbell': Dumbbell,
  'droplets': Droplets,
  'brain': Brain,
  'heart': Heart,
  'book-heart': BookOpen,
  'pill': Pill,
  'leaf': Leaf,
};

/**
 * Master Node - Level 1 expandable category node
 * Shows category name, count badge, and expand/collapse button
 */
const MasterNode = memo(({ data, selected }) => {
  const color = data.color || '#6b7280';
  const Icon = SECTION_ICONS[data.icon] || DOMAIN_ICONS[data.icon] || FileText;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-2xl shadow-lg border-2 transition-all duration-300
        bg-gradient-to-br from-white to-gray-50
        min-w-[160px] max-w-[220px]
        ${selected ? 'shadow-xl scale-105 ring-2 ring-offset-2' : 'hover:shadow-xl hover:scale-102'}
        ${data.expanded ? 'ring-2 ring-offset-1' : ''}
      `}
      style={{
        borderColor: color,
        '--tw-ring-color': color,
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!w-3 !h-3 !border-2 !border-white"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!w-3 !h-3 !border-2 !border-white"
        style={{ background: color }}
      />

      {/* Main content */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="p-2.5 rounded-xl shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>

        {/* Label and count */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-800 leading-tight truncate">
            {data.label}
          </div>
          {data.nodeCategory === 'solution' && (
            <div className="flex items-center gap-1.5 mt-1">
              {data.interventionCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-600">
                  {data.interventionCount} interventions
                </span>
              )}
            </div>
          )}
        </div>

        {/* Count badge */}
        {data.childCount > 0 && (
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: color }}
          >
            {data.childCount}
          </div>
        )}
      </div>

      {/* Expand/Collapse indicator */}
      {data.expandable && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 p-1 rounded-full bg-white border-2 shadow-md cursor-pointer hover:scale-110 transition-transform"
          style={{ borderColor: color }}
        >
          {data.expanded ? (
            <ChevronDown className="w-3 h-3" style={{ color }} />
          ) : (
            <ChevronRight className="w-3 h-3" style={{ color }} />
          )}
        </div>
      )}
    </div>
  );
});

MasterNode.displayName = 'MasterNode';

export default MasterNode;
