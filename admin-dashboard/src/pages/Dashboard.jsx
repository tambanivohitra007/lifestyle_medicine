import { useEffect, useState } from 'react';
import { Heart, Activity, Book, ChefHat, TrendingUp } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    conditions: 0,
    interventions: 0,
    scriptures: 0,
    recipes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentConditions, setRecentConditions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [conditions, interventions, scriptures, recipes] = await Promise.all([
        api.get(apiEndpoints.conditions),
        api.get(apiEndpoints.interventions),
        api.get(apiEndpoints.scriptures),
        api.get(apiEndpoints.recipes),
      ]);

      setStats({
        conditions: conditions.data.meta?.total || conditions.data.data.length,
        interventions: interventions.data.meta?.total || interventions.data.data.length,
        scriptures: scriptures.data.meta?.total || scriptures.data.data.length,
        recipes: recipes.data.meta?.total || recipes.data.data.length,
      });

      setRecentConditions(conditions.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Conditions',
      value: stats.conditions,
      icon: Heart,
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      link: '/conditions',
    },
    {
      title: 'Interventions',
      value: stats.interventions,
      icon: Activity,
      color: 'bg-secondary-500',
      textColor: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      link: '/interventions',
    },
    {
      title: 'Scriptures',
      value: stats.scriptures,
      icon: Book,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/scriptures',
    },
    {
      title: 'Recipes',
      value: stats.recipes,
      icon: ChefHat,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/recipes',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
          Welcome to the Knowledge Platform
        </h1>
        <p className="text-primary-100 text-sm sm:text-base">
          Manage lifestyle medicine content, evidence, and spiritual care resources
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer touch-manipulation"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="order-2 sm:order-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 sm:p-4 rounded-lg ${stat.bgColor} self-start sm:self-auto order-1 sm:order-2`}>
                <stat.icon className={`w-6 sm:w-8 h-6 sm:h-8 ${stat.textColor}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Conditions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Conditions</h2>
          <Link
            to="/conditions"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 active:text-primary-800"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {recentConditions.length === 0 ? (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
              No conditions found. Create your first condition to get started.
            </p>
          ) : (
            recentConditions.map((condition) => (
              <Link
                key={condition.id}
                to={`/conditions/${condition.id}`}
                className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 active:bg-primary-100/30 transition-all duration-200 touch-manipulation"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary-100 flex-shrink-0">
                  <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{condition.name}</h3>
                  {condition.category && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                      {condition.category}
                    </p>
                  )}
                  {condition.summary && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2 hidden sm:block">
                      {condition.summary}
                    </p>
                  )}
                </div>
                <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/conditions/new"
          className="card hover:shadow-lg transition-shadow duration-200 text-center touch-manipulation"
        >
          <Heart className="w-10 sm:w-12 h-10 sm:h-12 text-primary-600 mx-auto mb-2 sm:mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
            Add New Condition
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Create a new medical condition entry
          </p>
        </Link>

        <Link
          to="/interventions/new"
          className="card hover:shadow-lg transition-shadow duration-200 text-center touch-manipulation"
        >
          <Activity className="w-10 sm:w-12 h-10 sm:h-12 text-secondary-600 mx-auto mb-2 sm:mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
            Add Intervention
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Create a lifestyle intervention
          </p>
        </Link>

        <Link
          to="/scriptures/new"
          className="card hover:shadow-lg transition-shadow duration-200 text-center touch-manipulation"
        >
          <Book className="w-10 sm:w-12 h-10 sm:h-12 text-purple-600 mx-auto mb-2 sm:mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Add Scripture</h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Add spiritual care content
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
