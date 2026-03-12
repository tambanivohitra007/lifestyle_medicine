import { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import RevisionTimeline from './RevisionTimeline';
import RevisionDiff from './RevisionDiff';

/**
 * Displays the full revision history for a content entity with pagination.
 * Fetches revisions from the API and renders them as a timeline.
 * Supports viewing revision details in a modal and restoring previous versions.
 *
 * @param {Object} props
 * @param {string} props.entityType - The entity type identifier (e.g., 'condition', 'intervention')
 * @param {string} props.entityId - The UUID of the entity
 * @param {boolean} [props.canRestore=false] - Whether the user can restore previous revisions
 * @param {Function} [props.onRestored] - Callback invoked after a revision is successfully restored
 * @returns {React.ReactElement} The revision history panel
 */
const RevisionHistory = ({ entityType, entityId, canRestore = false, onRestored }) => {
  const { t } = useTranslation('common');
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (entityId) {
      fetchRevisions();
    }
  }, [entityType, entityId]);

  const fetchRevisions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.revisions(entityType, entityId)}?page=${page}`);
      setRevisions(response.data.data);
      setPagination(response.data.meta || {});
    } catch (error) {
      console.error('Error fetching revisions:', error);
      toast.error(t('revisions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (revision) => {
    if (!window.confirm(t('revisions.confirmRestore', { version: revision.version_number }))) {
      return;
    }

    try {
      setRestoring(true);
      await api.post(apiEndpoints.revisionRestore(entityType, entityId, revision.id));
      toast.success(t('revisions.restoreSuccess', { version: revision.version_number }));
      if (onRestored) onRestored();
    } catch (error) {
      console.error('Error restoring revision:', error);
      toast.error(t('revisions.restoreError'));
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <History className="w-4 h-4" />
        {t('revisions.title')}
        {revisions.length > 0 && (
          <span className="text-xs text-gray-500">
            ({revisions.length}{pagination.last_page > 1 ? '+' : ''})
          </span>
        )}
      </div>

      <RevisionTimeline
        revisions={revisions}
        onView={setSelectedRevision}
        onRestore={handleRestore}
        canRestore={canRestore && !restoring}
      />

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {t('pagination.page')} {pagination.current_page} {t('pagination.of')} {pagination.last_page}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchRevisions(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              {t('pagination.previous')}
            </button>
            <button
              onClick={() => fetchRevisions(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Revision Detail Modal */}
      <RevisionDiff
        isOpen={!!selectedRevision}
        onClose={() => setSelectedRevision(null)}
        revision={selectedRevision}
      />
    </div>
  );
};

export default RevisionHistory;
