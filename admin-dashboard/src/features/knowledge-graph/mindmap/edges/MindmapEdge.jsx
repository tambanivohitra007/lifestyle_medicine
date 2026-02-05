import { memo } from 'react';
import { BaseEdge, getBezierPath } from 'reactflow';

/**
 * Mindmap edge - organic curved connector for mindmap branches
 */
const MindmapEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}) => {
  const color = data?.color || '#94a3b8';
  const isDashed = data?.dashed;

  // Use bezier path for organic curves
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  return (
    <>
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isDashed ? '5,5' : undefined,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          filter: selected ? `drop-shadow(0 0 3px ${color})` : undefined,
          transition: 'stroke-width 0.2s, filter 0.2s',
        }}
      />

      {/* Subtle glow effect for visual depth */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.1}
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
});

MindmapEdge.displayName = 'MindmapEdge';

export default MindmapEdge;
