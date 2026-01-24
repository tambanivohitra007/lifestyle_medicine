import { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import OverviewCards from '../components/analytics/OverviewCards';
import CategoryPieChart from '../components/analytics/CategoryPieChart';
import DomainBarChart from '../components/analytics/DomainBarChart';
import GrowthLineChart from '../components/analytics/GrowthLineChart';
import ActivityTimeline from '../components/analytics/ActivityTimeline';
import QualityDistribution from '../components/analytics/QualityDistribution';
import ContentCompleteness from '../components/analytics/ContentCompleteness';

const Analytics = () => {
  const [loading, setLoading] = useState({
    overview: true,
    categories: true,
    domains: true,
    growth: true,
    activity: true,
    quality: true,
    completeness: true,
  });

  const [data, setData] = useState({
    overview: null,
    categories: null,
    domains: null,
    growth: null,
    activity: null,
    quality: null,
    completeness: null,
  });

  const [growthMonths, setGrowthMonths] = useState(12);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      const response = await api.get(apiEndpoints.analyticsOverview);
      setData((prev) => ({ ...prev, overview: response.data.data }));
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading((prev) => ({ ...prev, overview: false }));
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get(apiEndpoints.analyticsConditionsByCategory);
      setData((prev) => ({ ...prev, categories: response.data.data }));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await api.get(apiEndpoints.analyticsInterventionsByDomain);
      setData((prev) => ({ ...prev, domains: response.data.data }));
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setLoading((prev) => ({ ...prev, domains: false }));
    }
  };

  const fetchGrowth = async (months = growthMonths) => {
    setLoading((prev) => ({ ...prev, growth: true }));
    try {
      const response = await api.get(apiEndpoints.analyticsGrowth, {
        params: { months },
      });
      setData((prev) => ({ ...prev, growth: response.data.data }));
    } catch (error) {
      console.error('Failed to fetch growth:', error);
    } finally {
      setLoading((prev) => ({ ...prev, growth: false }));
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await api.get(apiEndpoints.analyticsUserActivity, {
        params: { limit: 20 },
      });
      setData((prev) => ({ ...prev, activity: response.data.data }));
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading((prev) => ({ ...prev, activity: false }));
    }
  };

  const fetchQuality = async () => {
    try {
      const response = await api.get(apiEndpoints.analyticsEvidenceQuality);
      setData((prev) => ({ ...prev, quality: response.data.data }));
    } catch (error) {
      console.error('Failed to fetch quality:', error);
    } finally {
      setLoading((prev) => ({ ...prev, quality: false }));
    }
  };

  const fetchCompleteness = async () => {
    try {
      const response = await api.get(apiEndpoints.analyticsContentCompleteness);
      setData((prev) => ({ ...prev, completeness: response.data.data }));
    } catch (error) {
      console.error('Failed to fetch completeness:', error);
    } finally {
      setLoading((prev) => ({ ...prev, completeness: false }));
    }
  };

  const fetchAll = async () => {
    await Promise.all([
      fetchOverview(),
      fetchCategories(),
      fetchDomains(),
      fetchGrowth(),
      fetchActivity(),
      fetchQuality(),
      fetchCompleteness(),
    ]);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading({
      overview: true,
      categories: true,
      domains: true,
      growth: true,
      activity: true,
      quality: true,
      completeness: true,
    });
    await fetchAll();
    setRefreshing(false);
  };

  const handleGrowthMonthsChange = (months) => {
    setGrowthMonths(months);
    fetchGrowth(months);
  };

  const handleExport = async () => {
    try {
      const response = await api.get(apiEndpoints.analyticsExport);
      const { data: reportData, filename } = response.data;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Content metrics, activity tracking, and data insights
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <section className="mb-8">
        <OverviewCards data={data.overview} loading={loading.overview} />
      </section>

      {/* Charts Row 1 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CategoryPieChart data={data.categories} loading={loading.categories} />
        <DomainBarChart data={data.domains} loading={loading.domains} />
      </section>

      {/* Growth Chart */}
      <section className="mb-6">
        <GrowthLineChart
          data={data.growth}
          loading={loading.growth}
          onMonthsChange={handleGrowthMonthsChange}
        />
      </section>

      {/* Bottom Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityTimeline data={data.activity} loading={loading.activity} />
        <QualityDistribution data={data.quality} loading={loading.quality} />
        <ContentCompleteness data={data.completeness} loading={loading.completeness} />
      </section>
    </div>
  );
};

export default Analytics;
