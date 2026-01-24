/**
 * Skeleton loader for list-based layouts
 * Used in: Evidence, References, EGW References
 *
 * @param {number} items - Number of skeleton items to display (default: 5)
 */
const SkeletonList = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="card animate-pulse">
          <div className="flex items-start justify-between mb-3">
            {/* Title and Badge */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>

              {/* Content lines */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 ml-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonList;
