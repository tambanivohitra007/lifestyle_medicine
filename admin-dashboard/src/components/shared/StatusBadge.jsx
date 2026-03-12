import { FileEdit, Eye, CheckCircle, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Visual configuration for each publishing status, mapping to Tailwind classes and icons.
 * @constant {Object.<string, {color: string, icon: React.ComponentType}>}
 */
const statusConfig = {
  draft: {
    color: 'bg-gray-100 text-gray-700',
    icon: FileEdit,
  },
  in_review: {
    color: 'bg-yellow-100 text-yellow-700',
    icon: Eye,
  },
  published: {
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  archived: {
    color: 'bg-red-100 text-red-700',
    icon: Archive,
  },
};

/**
 * Renders a colored badge indicating a content item's publishing status.
 * Displays an icon and translated label for: draft, in_review, published, archived.
 *
 * @param {Object} props
 * @param {string} props.status - The publishing status ('draft'|'in_review'|'published'|'archived')
 * @param {string} [props.size='sm'] - Badge size variant ('sm' or 'md')
 * @returns {React.ReactElement} The status badge element
 */
const StatusBadge = ({ status, size = 'sm' }) => {
  const { t } = useTranslation('common');
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${config.color} ${sizeClasses}`}>
      <Icon className={iconSize} />
      {t(`status.${status}`)}
    </span>
  );
};

export default StatusBadge;
