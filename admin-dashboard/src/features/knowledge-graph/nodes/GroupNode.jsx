import { memo } from 'react';

/**
 * Group/Container node for visually grouping related nodes.
 * Renders as a background container with a title label.
 * Draggable - when dragged, all child nodes move with it.
 */
const GroupNode = memo(({ data, selected, dragging }) => {
  const {
    label,
    width = 250,
    height = 200,
    color = '#6b7280',
    bgColor = '#f9fafb',
    borderColor = '#e5e7eb',
    icon,
  } = data;

  return (
    <div
      className={`
        rounded-2xl border-2 transition-all duration-200 cursor-move
        ${selected || dragging ? 'shadow-xl border-solid' : 'shadow-sm border-dashed'}
      `}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: bgColor,
        borderColor: selected || dragging ? color : borderColor,
        opacity: dragging ? 0.8 : 0.9,
      }}
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
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
