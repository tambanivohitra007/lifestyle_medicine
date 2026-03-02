import { Clock, User, RotateCcw, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

const RevisionTimeline = ({ revisions, onView, onRestore, canRestore = false }) => {
  const { t } = useTranslation('common');

  if (!revisions || revisions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t('revisions.noRevisions')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {revisions.map((revision, index) => (
          <div key={revision.id} className="relative flex gap-3">
            {/* Timeline dot */}
            <div
              className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0
                  ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              v{revision.version_number}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {revision.created_by && (
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {revision.created_by.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {revision.created_at
                      ? formatDistanceToNow(new Date(revision.created_at), { addSuffix: true })
                      : '-'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onView(revision)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-200 rounded transition-colors"
                    title={t('revisions.viewRevision')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canRestore && index > 0 && (
                    <button
                      onClick={() => onRestore(revision)}
                      className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title={t('revisions.restoreRevision')}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {revision.change_summary && (
                <p className="text-xs text-gray-600">{revision.change_summary}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionTimeline;
