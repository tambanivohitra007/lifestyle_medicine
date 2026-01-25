import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextPreview from '../../../components/shared/RichTextPreview';

/**
 * Table view for conditions list
 * Shows card layout on mobile, table on larger screens
 *
 * @param {Array} conditions - Array of condition objects
 * @param {function} onDelete - Callback for delete action
 * @param {boolean} canEdit - Whether user has edit permissions
 */
const ConditionTable = ({ conditions, onDelete, canEdit }) => {
  return (
    <>
      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {conditions.map((condition) => (
          <div key={condition.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {condition.name}
                </h3>
                {condition.category && (
                  <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                    {condition.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1">
                <Link
                  to={`/conditions/${condition.id}`}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {canEdit && (
                  <>
                    <Link
                      to={`/conditions/${condition.id}/edit`}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(condition.id, condition.name)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors touch-manipulation"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {condition.summary && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <RichTextPreview
                  content={condition.summary}
                  maxLines={2}
                  className="text-xs text-gray-600"
                />
              </div>
            )}
            <div className="mt-2 text-xs text-gray-400">
              Updated {condition.updated_at
                ? formatDistanceToNow(new Date(condition.updated_at), { addSuffix: true })
                : '-'}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conditions.map((condition) => (
                <tr key={condition.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {condition.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {condition.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                        {condition.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <RichTextPreview
                        content={condition.summary}
                        maxLines={2}
                        className="text-sm"
                      />
                      {!condition.summary && (
                        <span className="text-sm text-gray-400">No summary available</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {condition.updated_at
                      ? formatDistanceToNow(new Date(condition.updated_at), { addSuffix: true })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/conditions/${condition.id}`}
                        className="text-gray-600 hover:text-primary-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {canEdit && (
                        <>
                          <Link
                            to={`/conditions/${condition.id}/edit`}
                            className="text-gray-600 hover:text-primary-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => onDelete(condition.id, condition.name)}
                            className="text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ConditionTable;
