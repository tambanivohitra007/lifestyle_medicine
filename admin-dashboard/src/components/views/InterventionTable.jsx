import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Layers, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Table view for interventions
 *
 * @param {Array} interventions - Array of intervention objects
 * @param {function} onDelete - Callback for delete action
 */
const InterventionTable = ({ interventions, onDelete }) => {
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
                Care Domain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
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
            {interventions.map((intervention) => (
              <tr key={intervention.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {intervention.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {intervention.care_domain ? (
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-secondary-500" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-800">
                        {intervention.care_domain.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {intervention.tags && intervention.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {intervention.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                      {intervention.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{intervention.tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {intervention.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {intervention.updated_at
                    ? formatDistanceToNow(new Date(intervention.updated_at), { addSuffix: true })
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-1 justify-end">
                    <Link
                      to={`/interventions/${intervention.id}`}
                      className="action-btn"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Link>
                    <Link
                      to={`/interventions/${intervention.id}/edit`}
                      className="action-btn"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => onDelete(intervention.id, intervention.name)}
                      className="action-btn hover:bg-red-50 active:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
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

export default InterventionTable;
