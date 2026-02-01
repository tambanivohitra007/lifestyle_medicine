import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ContentCompleteness = ({ data, loading }) => {
  const { t } = useTranslation(['analytics']);
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics:charts.completeness')}</h3>
        <div className="flex items-center justify-center py-8 text-gray-500">
          {t('analytics:empty.noCompletenessData')}
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'conditions', labelKey: 'analytics:cards.conditions', color: 'primary' },
    { key: 'interventions', labelKey: 'analytics:cards.interventions', color: 'secondary' },
    { key: 'recipes', labelKey: 'analytics:cards.recipes', color: 'amber' },
  ];

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics:charts.completeness')}</h3>

      <div className="space-y-6">
        {categories.map((category) => {
          const stats = data[category.key];
          if (!stats) return null;

          const completePercent = stats.total > 0 ? (stats.complete / stats.total) * 100 : 0;
          const partialPercent = stats.total > 0 ? (stats.partial / stats.total) * 100 : 0;
          const incompletePercent = stats.total > 0 ? (stats.incomplete / stats.total) * 100 : 0;

          return (
            <div key={category.key}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">{t(category.labelKey)}</h4>
                <span className="text-sm text-gray-500">
                  {t('analytics:labels.average')} <span className="font-semibold text-gray-900">{stats.average_score}%</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${completePercent}%` }}
                  title={`${t('analytics:labels.complete')} ${stats.complete}`}
                />
                <div
                  className="bg-amber-500 transition-all"
                  style={{ width: `${partialPercent}%` }}
                  title={`${t('analytics:labels.partial')} ${stats.partial}`}
                />
                <div
                  className="bg-red-400 transition-all"
                  style={{ width: `${incompletePercent}%` }}
                  title={`${t('analytics:labels.incomplete')} ${stats.incomplete}`}
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span>{t('analytics:labels.complete')} {stats.complete}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('analytics:labels.partial')} {stats.partial}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>{t('analytics:labels.incomplete')} {stats.incomplete}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          {categories.map((category) => {
            const stats = data[category.key];
            if (!stats) return null;

            return (
              <div key={`summary-${category.key}`}>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">{t(category.labelKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContentCompleteness;
