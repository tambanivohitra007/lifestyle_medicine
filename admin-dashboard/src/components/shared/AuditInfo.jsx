import { User, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Displays audit trail metadata (created/updated timestamps and user names).
 * Shows creation and last update dates with associated user names when available.
 * Formats dates according to the active locale (English or French).
 *
 * @param {Object} props
 * @param {Object} props.data - Entity data containing audit fields
 * @param {string} [props.data.created_at] - ISO creation timestamp
 * @param {string} [props.data.updated_at] - ISO last-update timestamp
 * @param {Object} [props.data.created_by] - User who created the entity
 * @param {string} [props.data.created_by.name] - Creator's display name
 * @param {Object} [props.data.updated_by] - User who last updated the entity
 * @param {string} [props.data.updated_by.name] - Updater's display name
 * @returns {React.ReactElement|null} Audit info display or null if no data
 */
const AuditInfo = ({ data }) => {
  const { t, i18n } = useTranslation('common');

  if (!data) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasAuditData = data.created_by || data.updated_by || data.created_at || data.updated_at;

  if (!hasAuditData) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
      {data.created_at && (
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('audit.createdBy')} {formatDateTime(data.created_at)}
          {data.created_by && (
            <span className="flex items-center gap-1 text-gray-500">
              <User className="w-3 h-3" /> {data.created_by.name}
            </span>
          )}
        </span>
      )}
      {data.updated_at && data.updated_at !== data.created_at && (
        <>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            {t('audit.updatedBy')} {formatDateTime(data.updated_at)}
            {data.updated_by && (
              <span className="flex items-center gap-1 text-gray-500">
                <User className="w-3 h-3" /> {data.updated_by.name}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
};

export default AuditInfo;
