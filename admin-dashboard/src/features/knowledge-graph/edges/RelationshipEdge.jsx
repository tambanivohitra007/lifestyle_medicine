import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';

/**
 * @constant Relationship type configurations derived from edge ID substrings.
 * Maps edge ID patterns to display labels and emoji icons for hover tooltips.
 */
const RELATIONSHIP_LABELS = {
  'domain-int': { label: 'belongs to', icon: '🏷️' },
  'int-ev': { label: 'supported by', icon: '📊' },
  'ev-ref': { label: 'cited in', icon: '📄' },
  'cond-scr': { label: 'scripture', icon: '📖' },
  'cond-rec': { label: 'recipe', icon: '🍽️' },
  'cond-egw': { label: 'EGW', icon: '✝️' },
  'int-scr': { label: 'scripture', icon: '📖' },
  'int-rec': { label: 'recipe', icon: '🍽️' },
  'int-egw': { label: 'EGW', icon: '✝️' },
};

/**
 * Custom React Flow edge for generic (non-intervention) relationships.
 * Renders a smooth-step path with an invisible wider hit-area for easier hover detection.
 * Shows a relationship type label (derived from edge ID pattern matching) on hover or selection.
 * Adjusts stroke width and opacity based on hover/selection state.
 *
 * @param {Object} props - React Flow edge props (id, sourceX/Y, targetX/Y, positions, etc.)
 */
const RelationshipEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  style,
  data,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Derive relationship type from edge ID
  const getRelationshipConfig = () => {
    for (const [key, config] of Object.entries(RELATIONSHIP_LABELS)) {
      if (id.includes(key)) {
        return config;
      }
    }
    return null;
  };

  const relationshipConfig = getRelationshipConfig();

  // Merge default style with passed style
  const edgeStyle = {
    strokeWidth: selected ? 2.5 : isHovered ? 2 : 1.5,
    filter: selected ? 'drop-shadow(0 0 3px rgba(0,0,0,0.2))' : undefined,
    opacity: isHovered || selected ? 1 : 0.7,
    transition: 'all 0.2s ease',
    ...style,
  };

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />

      {/* Edge label - show on hover or when selected */}
      {relationshipConfig && (isHovered || selected) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium
                         bg-white/95 shadow-md border border-gray-200 backdrop-blur-sm"
              style={{
                color: style?.stroke || '#64748b',
              }}
            >
              <span>{relationshipConfig.icon}</span>
              <span>{relationshipConfig.label}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';

export default RelationshipEdge;
