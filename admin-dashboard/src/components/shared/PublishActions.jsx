import { CheckCircle, Eye, Archive, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Renders publishing workflow action buttons based on the current entity status and user role.
 * Shows appropriate transitions: draft -> review -> published -> archived, and back.
 * Admin users see additional actions (publish, archive).
 *
 * @param {Object} props
 * @param {string} props.status - Current publishing status ('draft'|'in_review'|'published'|'archived')
 * @param {Function} props.onAction - Callback with the action key (e.g., 'publish', 'archive', 'submit-for-review', 'return-to-draft')
 * @param {boolean} [props.loading=false] - Whether action buttons should be disabled
 * @returns {React.ReactElement|null} Action buttons or null if no actions available
 */
const PublishActions = ({ status, onAction, loading = false }) => {
  const { t } = useTranslation('common');
  const { isAdmin } = useAuth();

  const actions = [];

  if (status === 'draft') {
    actions.push({
      key: 'submit-for-review',
      label: t('actions.submitForReview'),
      icon: Eye,
      className: 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200',
    });
    if (isAdmin) {
      actions.push({
        key: 'publish',
        label: t('actions.publish'),
        icon: CheckCircle,
        className: 'text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200',
      });
    }
  }

  if (status === 'in_review') {
    actions.push({
      key: 'return-to-draft',
      label: t('actions.returnToDraft'),
      icon: RotateCcw,
      className: 'text-gray-700 bg-gray-50 hover:bg-gray-100 active:bg-gray-200',
    });
    if (isAdmin) {
      actions.push({
        key: 'publish',
        label: t('actions.publish'),
        icon: CheckCircle,
        className: 'text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200',
      });
    }
  }

  if (status === 'published') {
    if (isAdmin) {
      actions.push({
        key: 'archive',
        label: t('actions.archive'),
        icon: Archive,
        className: 'text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200',
      });
    }
    actions.push({
      key: 'return-to-draft',
      label: t('actions.returnToDraft'),
      icon: RotateCcw,
      className: 'text-gray-700 bg-gray-50 hover:bg-gray-100 active:bg-gray-200',
    });
  }

  if (status === 'archived') {
    actions.push({
      key: 'return-to-draft',
      label: t('actions.returnToDraft'),
      icon: RotateCcw,
      className: 'text-gray-700 bg-gray-50 hover:bg-gray-100 active:bg-gray-200',
    });
    if (isAdmin) {
      actions.push({
        key: 'publish',
        label: t('actions.publish'),
        icon: CheckCircle,
        className: 'text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200',
      });
    }
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            onClick={() => onAction(action.key)}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all touch-manipulation ${action.className} disabled:opacity-50`}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
};

export default PublishActions;
