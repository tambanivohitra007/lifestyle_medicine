import { memo, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Group/Container node for visually grouping related nodes.
 * Renders as a background container with a title label.
 * Draggable - when dragged, all child nodes move with it.
 * Supports collapse/expand to hide/show child nodes.
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
    onToggleCollapse,
    isCollapsed = false,
  } = data;

  const [collapsed, setCollapsed] = useState(isCollapsed);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsed);
    }
  }, [collapsed, onToggleCollapse]);

  const displayHeight = collapsed ? 50 : height;

  return (
    <div
      className={`
        rounded-2xl border-2 transition-all duration-300 cursor-move relative
        ${selected || dragging ? 'shadow-xl border-solid' : 'shadow-sm border-dashed'}
      `}
      style={{
        width: `${width}px`,
        height: `${displayHeight}px`,
        backgroundColor: bgColor,
        borderColor: selected || dragging ? color : borderColor,
        opacity: dragging ? 0.8 : 0.9,
        overflow: 'hidden',
      }}
    >
      {/* Header Label with Collapse Toggle */}
      <div
        className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-semibold shadow-sm cursor-pointer hover:scale-105 transition-transform"
        style={{
          backgroundColor: color,
          color: 'white',
        }}
        onClick={handleToggle}
      >
        <span className="flex items-center gap-1.5">
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
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

      {/* Collapsed indicator */}
      {collapsed && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[10px] font-medium"
          style={{ color: color }}
        >
          Click header to expand
        </div>
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
