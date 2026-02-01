import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Stethoscope, Layers, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import RichTextPreview from '../../../components/shared/RichTextPreview';

/**
 * Compact list view for interventions
 *
 * @param {Array} interventions - Array of intervention objects
 * @param {function} onDelete - Callback for delete action
 * @param {boolean} canEdit - Whether user has edit permissions
 */
const InterventionList = ({ interventions, onDelete, onEdit, canEdit }) => {
  const { t } = useTranslation(['common']);

  return (
    <div className="space-y-3">
      {interventions.map((intervention) => (
        <div
          key={intervention.id}
          className="card hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className="p-2 rounded-lg bg-green-100 flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-green-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
                    {intervention.name}
                  </h3>

                  {/* Care Domain */}
                  {intervention.care_domain && (
                    <div className="flex items-center gap-1 mb-2">
                      <Layers className="w-3 h-3 text-secondary-500" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-800">
                        {intervention.care_domain.name}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {intervention.tags && intervention.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
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
                  )}

                  <RichTextPreview
                    content={intervention.description}
                    maxLines={1}
                    className="text-xs sm:text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0 -mr-1">
                  <Link
                    to={`/interventions/${intervention.id}`}
                    className="action-btn p-2 touch-manipulation"
                    title={t('common:buttons.viewDetails')}
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </Link>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => onEdit(intervention.id)}
                        className="action-btn p-2 touch-manipulation"
                        title={t('common:buttons.edit')}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => onDelete(intervention.id, intervention.name)}
                        className="action-btn p-2 touch-manipulation hover:bg-red-50 active:bg-red-100"
                        title={t('common:buttons.delete')}
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
                  {t('common:audit.updatedAt')} {intervention.updated_at
                    ? formatDistanceToNow(new Date(intervention.updated_at), { addSuffix: true })
                    : t('common:time.recently')}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InterventionList;
