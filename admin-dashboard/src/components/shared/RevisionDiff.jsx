import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';

const formatValue = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const SKIP_FIELDS = ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by'];

const RevisionDiff = ({ isOpen, onClose, revision, title }) => {
  const { t } = useTranslation('common');

  if (!revision) return null;

  const data = revision.data || {};
  const displayFields = Object.entries(data).filter(
    ([key]) => !SKIP_FIELDS.includes(key)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || `${t('revisions.version')} ${revision.version_number}`} size="lg">
      <div className="space-y-4">
        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-3 border-b border-gray-200">
          <span>{t('revisions.version')}: <strong>v{revision.version_number}</strong></span>
          {revision.created_by && (
            <span>{t('common:audit.createdBy')}: <strong>{revision.created_by.name}</strong></span>
          )}
          {revision.created_at && (
            <span>{new Date(revision.created_at).toLocaleString()}</span>
          )}
        </div>

        {revision.change_summary && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            {revision.change_summary}
          </div>
        )}

        {/* Data fields */}
        <div className="space-y-3">
          {displayFields.map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {formatValue(value)}
              </div>
            </div>
          ))}
          {displayFields.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              {t('revisions.noData')}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RevisionDiff;
