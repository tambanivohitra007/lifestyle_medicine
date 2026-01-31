import { Eye, Edit, Trash2, HeartPulse } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextPreview from '../../../components/shared/RichTextPreview';

/**
 * Compact list view for conditions
 *
 * @param {Array} conditions - Array of condition objects
 * @param {function} onDelete - Callback for delete action
 * @param {boolean} canEdit - Whether user has edit permissions
 */
const ConditionList = ({ conditions, onDelete, onEdit, onView, canEdit }) => {
  return (
    <div className="space-y-3">
      {conditions.map((condition) => (
        <div
          key={condition.id}
          className="card hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className="p-2 rounded-lg bg-primary-100 flex-shrink-0">
              <HeartPulse className="w-5 h-5 text-primary-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
                    {condition.name}
                  </h3>
                  {condition.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 mb-2">
                      {condition.category}
                    </span>
                  )}
                  <RichTextPreview
                    content={condition.summary}
                    maxLines={1}
                    className="text-xs sm:text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0 -mr-1">
                  <button
                    onClick={() => onView(condition.id)}
                    className="action-btn p-2 touch-manipulation"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => onEdit(condition.id)}
                        className="action-btn p-2 touch-manipulation"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => onDelete(condition.id, condition.name)}
                        className="action-btn p-2 touch-manipulation hover:bg-red-50 active:bg-red-100"
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
                  Updated {condition.updated_at
                    ? formatDistanceToNow(new Date(condition.updated_at), { addSuffix: true })
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

export default ConditionList;
