import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, ChefHat, Clock, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextPreview from '../../../components/shared/RichTextPreview';

/**
 * Compact list view for recipes
 *
 * @param {Array} recipes - Array of recipe objects
 * @param {function} onDelete - Callback for delete action
 * @param {boolean} canEdit - Whether user has edit permissions
 */
const RecipeList = ({ recipes, onDelete, canEdit }) => {
  return (
    <div className="space-y-3">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="card hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="p-2 rounded-lg bg-orange-100 flex-shrink-0">
              <ChefHat className="w-5 h-5 text-orange-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                    {recipe.title}
                  </h3>

                  {/* Dietary Tags */}
                  {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
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
                  )}

                  {/* Content Tags */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                      {recipe.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{recipe.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Cooking Times */}
                  {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        {recipe.prep_time_minutes && `Prep: ${recipe.prep_time_minutes}min`}
                        {recipe.prep_time_minutes && recipe.cook_time_minutes && ' | '}
                        {recipe.cook_time_minutes && `Cook: ${recipe.cook_time_minutes}min`}
                      </span>
                    </div>
                  )}

                  <RichTextPreview
                    content={recipe.description}
                    maxLines={1}
                    className="text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Link
                    to={`/recipes/${recipe.id}`}
                    className="action-btn"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </Link>
                  {canEdit && (
                    <>
                      <Link
                        to={`/recipes/${recipe.id}/edit`}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <button
                        onClick={() => onDelete(recipe.id, recipe.title)}
                        className="action-btn"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>
                  Updated {recipe.updated_at
                    ? formatDistanceToNow(new Date(recipe.updated_at), { addSuffix: true })
                    : 'recently'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecipeList;
