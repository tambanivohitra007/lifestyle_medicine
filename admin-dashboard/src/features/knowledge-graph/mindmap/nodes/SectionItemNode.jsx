import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText } from 'lucide-react';

/**
 * Section item node - individual section items (e.g., specific risk factor, complication)
 */
const SectionItemNode = memo(({ data, selected }) => {
  const color = data.color || '#6b7280';

  // Truncate title for display
  const displayTitle = data.title?.length > 40
    ? `${data.title.substring(0, 40)}...`
    : data.title;

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg shadow-md border-2 transition-all duration-200
        bg-white min-w-[120px] max-w-[180px] cursor-pointer
        ${selected ? 'shadow-lg scale-105' : 'hover:shadow-lg hover:scale-102'}
      `}
      style={{ borderColor: color }}
    >
      {/* Connection handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2"
        style={{ background: color }}
      />

      {/* Content */}
      <div className="flex items-start gap-2">
        <div
          className="p-1 rounded shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}15` }}
        >
          <FileText className="w-3 h-3" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-xs text-gray-800 leading-tight">
            {displayTitle}
          </div>
          <div
            className="mt-0.5 text-[10px] font-medium"
            style={{ color }}
          >
            {data.sectionLabel}
          </div>
        </div>
      </div>

      {/* Visual indicator that there's content to view */}
      {data.body && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white"
             title="Click to view details" />
      )}
    </div>
  );
});

SectionItemNode.displayName = 'SectionItemNode';

export default SectionItemNode;
