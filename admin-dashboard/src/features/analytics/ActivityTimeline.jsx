import { HeartPulse, Activity, Book, ChefHat, BookMarked, Plus, Edit2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  condition: HeartPulse,
  intervention: Activity,
  scripture: Book,
  recipe: ChefHat,
  egw_reference: BookMarked,
};

const typeColors = {
  condition: 'bg-primary-100 text-primary-700',
  intervention: 'bg-secondary-100 text-secondary-700',
  scripture: 'bg-blue-100 text-blue-700',
  recipe: 'bg-amber-100 text-amber-700',
  egw_reference: 'bg-purple-100 text-purple-700',
};

const typeLabels = {
  condition: 'Condition',
  intervention: 'Intervention',
  scripture: 'Scripture',
  recipe: 'Recipe',
  egw_reference: 'EGW Reference',
};

const ActivityTimeline = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Clock className="w-12 h-12 text-gray-300 mb-2" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {data.map((activity, index) => {
          const Icon = typeIcons[activity.type] || HeartPulse;
          const colorClass = typeColors[activity.type] || 'bg-gray-100 text-gray-700';
          const typeLabel = typeLabels[activity.type] || activity.type;

          return (
            <div key={`${activity.type}-${activity.id}-${activity.action}-${index}`} className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      activity.action === 'created'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {activity.action === 'created' ? (
                      <Plus className="w-3 h-3 mr-0.5" />
                    ) : (
                      <Edit2 className="w-3 h-3 mr-0.5" />
                    )}
                    {activity.action}
                  </span>
                  <span className="text-xs text-gray-500">{typeLabel}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate mt-0.5" title={activity.name}>
                  {activity.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{activity.user}</span>
                  <span>-</span>
                  <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
