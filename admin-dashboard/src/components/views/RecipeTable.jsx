import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Clock, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextPreview from '../RichTextPreview';

/**
 * Table view for recipes
 *
 * @param {Array} recipes - Array of recipe objects
 * @param {function} onDelete - Callback for delete action
 */
const RecipeTable = ({ recipes, onDelete }) => {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dietary Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Times
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
            {recipes.map((recipe) => (
              <tr key={recipe.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {recipe.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {recipe.dietary_tags && recipe.dietary_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {recipe.dietary_tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.dietary_tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{recipe.dietary_tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(recipe.prep_time_minutes || recipe.cook_time_minutes) ? (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>
                        {recipe.prep_time_minutes && `${recipe.prep_time_minutes}m`}
                        {recipe.prep_time_minutes && recipe.cook_time_minutes && ' + '}
                        {recipe.cook_time_minutes && `${recipe.cook_time_minutes}m`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <RichTextPreview
                      content={recipe.description}
                      maxLines={2}
                      className="text-sm"
                    />
                    {!recipe.description && (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {recipe.updated_at
                    ? formatDistanceToNow(new Date(recipe.updated_at), { addSuffix: true })
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-1 justify-end">
                    <Link
                      to={`/recipes/${recipe.id}`}
                      className="action-btn"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Link>
                    <Link
                      to={`/recipes/${recipe.id}/edit`}
                      className="action-btn"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => onDelete(recipe.id, recipe.title)}
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

export default RecipeTable;
