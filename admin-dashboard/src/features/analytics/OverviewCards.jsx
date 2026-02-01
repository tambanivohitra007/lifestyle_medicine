import { HeartPulse, Activity, Book, ChefHat, BookMarked, TestTube, Users, Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, icon: Icon, color, subValue, subLabel }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value?.toLocaleString() ?? '-'}</p>
        {subValue !== undefined && (
          <p className="text-sm text-gray-500 mt-1">
            <span className="text-green-600 font-medium">+{subValue}</span> {subLabel}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const OverviewCards = ({ data, loading }) => {
  const { t } = useTranslation(['analytics']);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: t('analytics:cards.conditions'),
      value: data?.counts?.conditions,
      icon: HeartPulse,
      color: 'bg-primary-600',
      subValue: data?.this_week?.created,
      subLabel: t('analytics:cards.thisWeek'),
    },
    {
      title: t('analytics:cards.interventions'),
      value: data?.counts?.interventions,
      icon: Activity,
      color: 'bg-secondary-600',
      subValue: data?.this_week?.created,
      subLabel: t('analytics:cards.thisWeek'),
    },
    {
      title: t('analytics:cards.scriptures'),
      value: data?.counts?.scriptures,
      icon: Book,
      color: 'bg-blue-600',
    },
    {
      title: t('analytics:cards.recipes'),
      value: data?.counts?.recipes,
      icon: ChefHat,
      color: 'bg-amber-600',
    },
    {
      title: t('analytics:cards.egwWritings'),
      value: data?.counts?.egw_references,
      icon: BookMarked,
      color: 'bg-purple-600',
    },
    {
      title: t('analytics:cards.evidenceEntries'),
      value: data?.counts?.evidence_entries,
      icon: TestTube,
      color: 'bg-emerald-600',
    },
    {
      title: t('analytics:cards.users'),
      value: data?.counts?.users,
      icon: Users,
      color: 'bg-slate-600',
    },
    {
      title: t('analytics:cards.createdToday'),
      value: data?.today?.created,
      icon: Plus,
      color: 'bg-green-600',
      subValue: data?.today?.updated,
      subLabel: t('analytics:cards.updated'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export default OverviewCards;
