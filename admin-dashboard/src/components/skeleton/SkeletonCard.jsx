/**
 * Skeleton loader for card-based layouts
 * Used in: Conditions, Interventions, Recipes grids
 */
const SkeletonCard = () => {
  return (
    <div className="card animate-pulse">
      {/* Icon and Actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-gray-200 w-10 h-10"></div>
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>

      {/* Category/Badge */}
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>

      {/* Description lines */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="h-3 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
