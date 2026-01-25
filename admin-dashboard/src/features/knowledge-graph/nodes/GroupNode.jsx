import { memo, useState } from 'react';

/**
 * Group/Container node for visually grouping related nodes.
 * Renders as a background container with a title label.
 * Draggable - when dragged, all child nodes move with it.
 * The container stretches to contain child nodes (via ReactFlow's expandParent).
 */
const GroupNode = memo(({ data, selected, dragging }) => {
  const {
    label,
    color = '#6b7280',
    bgColor = '#f9fafb',
    borderColor = '#e5e7eb',
    icon,
  } = data;

  const [isHovered, setIsHovered] = useState(false);

  // Determine visual state for containment feedback
  const isActive = selected || dragging || isHovered;

  return (
    <div
      className={`
        group rounded-2xl transition-all duration-200 cursor-move relative
        ${isActive ? 'shadow-lg' : 'shadow-sm'}
      `}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '200px',
        minHeight: '100px',
        backgroundColor: bgColor,
        border: `2px ${isActive ? 'solid' : 'dashed'} ${isActive ? color : borderColor}`,
        opacity: dragging ? 0.85 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Label */}
      <div
        className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
        style={{
          backgroundColor: color,
          color: 'white',
        }}
      >
        <span className="flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {label}
        </span>
      </div>

      {/* Optional count badge */}
      {data.count !== undefined && (
        <div
          className="absolute -top-2 right-4 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white shadow-sm border"
          style={{ borderColor: borderColor }}
        >
          {data.count} items
        </div>
      )}

      {/* Double-click hint (shown on hover) */}
      <div
        className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      >
        Double-click to zoom
      </div>
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
