/**
 * Skeleton loader for table layouts
 * Used in: Users, and other table-based pages
 *
 * @param {number} rows - Number of skeleton rows to display (default: 5)
 */
const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="card overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4 animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="flex gap-2 ml-auto">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonTable;
