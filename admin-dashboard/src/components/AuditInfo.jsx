import { User, Calendar, Clock } from 'lucide-react';

const AuditInfo = ({ data }) => {
  if (!data) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasAuditData = data.created_by || data.updated_by || data.created_at || data.updated_at;

  if (!hasAuditData) return null;

  return (
    <div className="card bg-gray-50 border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {/* Created */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Created</span>
          </div>
          <div className="pl-6 space-y-0.5">
            {data.created_at && (
              <p className="text-gray-900">
                {formatDate(data.created_at)} at {formatTime(data.created_at)}
              </p>
            )}
            {data.created_by && (
              <p className="flex items-center gap-1 text-gray-600">
                <User className="w-3 h-3" />
                {data.created_by.name}
              </p>
            )}
          </div>
        </div>

        {/* Updated */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last Updated</span>
          </div>
          <div className="pl-6 space-y-0.5">
            {data.updated_at && (
              <p className="text-gray-900">
                {formatDate(data.updated_at)} at {formatTime(data.updated_at)}
              </p>
            )}
            {data.updated_by && (
              <p className="flex items-center gap-1 text-gray-600">
                <User className="w-3 h-3" />
                {data.updated_by.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditInfo;
