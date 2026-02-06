import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from 'reactflow';

const STRENGTH_CONFIG = {
  high: {
    color: '#22c55e',
    label: 'High',
    strokeWidth: 3,
    animated: true,
  },
  moderate: {
    color: '#eab308',
    label: 'Moderate',
    strokeWidth: 2,
    animated: false,
  },
  emerging: {
    color: '#3b82f6',
    label: 'Emerging',
    strokeWidth: 2,
    animated: false,
  },
  insufficient: {
    color: '#9ca3af',
    label: 'Insufficient',
    strokeWidth: 1,
    animated: false,
  },
};

const RECOMMENDATION_CONFIG = {
  core: { label: 'Core', color: '#22c55e', bg: 'bg-green-100' },
  adjunct: { label: 'Adjunct', color: '#3b82f6', bg: 'bg-blue-100' },
  optional: { label: 'Optional', color: '#9ca3af', bg: 'bg-gray-100' },
};

const EFFECTIVENESS_CONFIG = {
  very_high: { label: 'Very High', color: '#059669', bg: 'bg-emerald-100', icon: '★★★★★' },
  high: { label: 'High', color: '#16a34a', bg: 'bg-green-100', icon: '★★★★☆' },
  moderate: { label: 'Moderate', color: '#ca8a04', bg: 'bg-yellow-100', icon: '★★★☆☆' },
  low: { label: 'Low', color: '#ea580c', bg: 'bg-orange-100', icon: '★★☆☆☆' },
  uncertain: { label: 'Uncertain', color: '#64748b', bg: 'bg-slate-100', icon: '?' },
};

const ConditionInterventionEdge = memo(({
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
  const [showTooltip, setShowTooltip] = useState(false);

  const strength = data?.strengthOfEvidence || 'emerging';
  const recommendation = data?.recommendationLevel || 'optional';
  const clinicalNotes = data?.clinicalNotes;
  const effectiveness = data?.effectiveness;

  const config = STRENGTH_CONFIG[strength] || STRENGTH_CONFIG.emerging;
  const recConfig = RECOMMENDATION_CONFIG[recommendation] || RECOMMENDATION_CONFIG.optional;
  const effConfig = effectiveness ? (EFFECTIVENESS_CONFIG[effectiveness.rating] || EFFECTIVENESS_CONFIG.uncertain) : null;

  // Use effectiveness color if available and significant
  const displayConfig = effConfig && ['very_high', 'high'].includes(effectiveness.rating) ? {
    ...config,
    color: effConfig.color,
  } : config;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: displayConfig.color,
          strokeWidth: selected ? displayConfig.strokeWidth + 1 : displayConfig.strokeWidth,
          filter: selected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : undefined,
        }}
        className={displayConfig.animated ? 'animated-edge' : ''}
      />

      {/* Animated dash overlay for high strength or very high effectiveness */}
      {(displayConfig.animated || (effectiveness?.rating === 'very_high')) && (
        <path
          d={edgePath}
          fill="none"
          stroke={displayConfig.color}
          strokeWidth={displayConfig.strokeWidth}
          strokeDasharray="5,5"
          className="animate-dash"
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Primary intervention indicator */}
      {effectiveness?.isPrimary && (
        <path
          d={edgePath}
          fill="none"
          stroke={displayConfig.color}
          strokeWidth={displayConfig.strokeWidth + 2}
          strokeOpacity={0.3}
        />
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Main badge */}
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold
              bg-white shadow-md border-2 cursor-pointer transition-all
              hover:scale-110 hover:shadow-lg
              ${selected ? 'ring-2 ring-offset-1' : ''}
              ${effectiveness?.isPrimary ? 'ring-2 ring-purple-400' : ''}
            `}
            style={{
              borderColor: displayConfig.color,
              color: displayConfig.color,
              ringColor: displayConfig.color,
            }}
          >
            {effectiveness?.isPrimary && <span className="text-purple-500">★</span>}
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: displayConfig.color }}
            />
            {effConfig ? effConfig.label : config.label}
          </div>

          {/* Tooltip */}
          {showTooltip && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                         bg-white rounded-lg shadow-xl border border-gray-200 p-3
                         min-w-[180px] max-w-[250px]"
            >
              <div className="text-xs font-semibold text-gray-900 mb-2">
                Relationship Details
              </div>

              <div className="space-y-2">
                {/* Strength */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Evidence:</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Recommendation */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Level:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${recConfig.bg}`}
                    style={{ color: recConfig.color }}
                  >
                    {recConfig.label}
                  </span>
                </div>

                {/* Effectiveness (if available) */}
                {effConfig && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Effectiveness:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${effConfig.bg}`}
                        style={{ color: effConfig.color }}
                      >
                        {effConfig.label}
                      </span>
                    </div>
                    {effectiveness?.isPrimary && (
                      <div className="flex items-center gap-1 text-[10px] text-purple-600 font-medium">
                        <span>★</span> Primary Intervention
                      </div>
                    )}
                    {effectiveness?.evidenceGrade && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">GRADE:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                          Grade {effectiveness.evidenceGrade}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Clinical Notes */}
                {clinicalNotes && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-[10px] text-gray-500 mb-1">Notes:</div>
                    <div className="text-[10px] text-gray-700 italic leading-relaxed">
                      {clinicalNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3
                           bg-white border-l border-t border-gray-200 rotate-45"
              />
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

ConditionInterventionEdge.displayName = 'ConditionInterventionEdge';

export default ConditionInterventionEdge;
