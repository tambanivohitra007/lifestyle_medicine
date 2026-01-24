import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextPreview from '../../../components/shared/RichTextPreview';

/**
 * Table view for conditions list
 *
 * @param {Array} conditions - Array of condition objects
 * @param {function} onDelete - Callback for delete action
 */
const ConditionTable = ({ conditions, onDelete }) => {
  return (
    <div className="card overflow-hidden">
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConditionTable;
