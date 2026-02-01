import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SERIES_CONFIG = [
  { key: 'conditions', labelKey: 'analytics:cards.conditions', color: '#d31e3a' },
  { key: 'interventions', labelKey: 'analytics:cards.interventions', color: '#243b53' },
  { key: 'scriptures', labelKey: 'analytics:cards.scriptures', color: '#3b82f6' },
  { key: 'recipes', labelKey: 'analytics:cards.recipes', color: '#f59e0b' },
  { key: 'egw_references', labelKey: 'analytics:cards.egwWritings', color: '#8b5cf6' },
];

const GrowthLineChart = ({ data, loading, onMonthsChange }) => {
  const { t } = useTranslation(['analytics']);
  const SERIES = SERIES_CONFIG.map(s => ({ ...s, label: t(s.labelKey) }));
  const [months, setMonths] = useState(12);
  const [visibleSeries, setVisibleSeries] = useState(
    SERIES.reduce((acc, s) => ({ ...acc, [s.key]: true }), {})
  );

  const handleMonthsChange = (newMonths) => {
    setMonths(newMonths);
    if (onMonthsChange) {
      onMonthsChange(newMonths);
    }
  };

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-full h-48 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics:charts.contentGrowth')}</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          {t('analytics:empty.noGrowthData')}
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const monthData = data.find((d) => d.label === label);
      return (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry) => (
            <p key={entry.dataKey} className="text-sm flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
                {SERIES.find((s) => s.key === entry.dataKey)?.label}: {entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Content Growth Over Time</h3>
        <select
          value={months}
          onChange={(e) => handleMonthsChange(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </select>
      </div>

      {/* Series Toggle */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SERIES.map((series) => (
          <button
            key={series.key}
            onClick={() => toggleSeries(series.key)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              visibleSeries[series.key]
                ? 'border-transparent text-white'
                : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: visibleSeries[series.key] ? series.color : undefined,
            }}
          >
            {series.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {SERIES.map((series) =>
            visibleSeries[series.key] ? (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color}
                strokeWidth={2}
                dot={{ fill: series.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrowthLineChart;
