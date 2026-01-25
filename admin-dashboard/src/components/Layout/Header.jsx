import { User, Settings, PanelLeftClose, PanelLeft, HeartPulse, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

// Page title mapping
const getPageTitle = (pathname) => {
  const routes = {
    '/': { title: 'Lifestyle Medicine', subtitle: 'Knowledge Platform' },
    '/conditions': { title: 'Conditions', subtitle: 'Health Conditions' },
    '/interventions': { title: 'Interventions', subtitle: 'Treatment Options' },
    '/care-domains': { title: 'Care Domains', subtitle: 'Lifestyle Categories' },
    '/search': { title: 'Search', subtitle: 'Find Content' },
    '/bible': { title: 'Bible Explorer', subtitle: 'Scripture Search' },
    '/evidence': { title: 'Evidence', subtitle: 'Research & Studies' },
    '/references': { title: 'References', subtitle: 'Citations & Sources' },
    '/scriptures': { title: 'Scriptures', subtitle: 'Bible Verses' },
    '/egw-references': { title: 'EGW Writings', subtitle: 'Spirit of Prophecy' },
    '/recipes': { title: 'Recipes', subtitle: 'Healthy Meals' },
    '/profile': { title: 'Settings', subtitle: 'Account & Preferences' },
    '/analytics': { title: 'Analytics', subtitle: 'Usage Statistics' },
    '/users': { title: 'Users', subtitle: 'User Management' },
    '/tags': { title: 'Content Tags', subtitle: 'Tag Management' },
    '/import': { title: 'Import Data', subtitle: 'Bulk Import' },
    '/ai-generator': { title: 'AI Generator', subtitle: 'Content Generation' },
  };

  // Check for exact match first
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith('/conditions/')) {
    if (pathname.includes('/edit')) return { title: 'Edit Condition', subtitle: 'Modify Details' };
    if (pathname.includes('/interventions/attach')) return { title: 'Attach Intervention', subtitle: 'Link Treatment' };
    return { title: 'Condition Details', subtitle: 'View Information' };
  }
  if (pathname.startsWith('/interventions/')) {
    if (pathname.includes('/edit')) return { title: 'Edit Intervention', subtitle: 'Modify Details' };
    return { title: 'Intervention Details', subtitle: 'View Information' };
  }
  if (pathname.startsWith('/recipes/')) {
    if (pathname.includes('/edit')) return { title: 'Edit Recipe', subtitle: 'Modify Details' };
    if (pathname === '/recipes/new') return { title: 'New Recipe', subtitle: 'Create Recipe' };
    return { title: 'Recipe Details', subtitle: 'View Recipe' };
  }
  if (pathname.startsWith('/scriptures/')) {
    if (pathname.includes('/edit')) return { title: 'Edit Scripture', subtitle: 'Modify Details' };
    return { title: 'Scripture Details', subtitle: 'View Verse' };
  }
  if (pathname.startsWith('/egw-references/')) {
    if (pathname.includes('/edit')) return { title: 'Edit EGW Reference', subtitle: 'Modify Details' };
    return { title: 'EGW Reference', subtitle: 'View Writing' };
  }
  if (pathname.startsWith('/evidence/')) {
    if (pathname.includes('/edit')) return { title: 'Edit Evidence', subtitle: 'Modify Details' };
    return { title: 'Evidence Details', subtitle: 'View Study' };
  }
  if (pathname.startsWith('/references/')) {
    if (pathname.includes('/edit')) return { title: 'Edit Reference', subtitle: 'Modify Details' };
    return { title: 'Reference Details', subtitle: 'View Citation' };
  }
  if (pathname.startsWith('/care-domains/')) {
    if (pathname.includes('/edit')) return { title: 'Edit Care Domain', subtitle: 'Modify Details' };
    return { title: 'Care Domain Details', subtitle: 'View Category' };
  }
  if (pathname.startsWith('/users/')) {
    if (pathname.includes('/edit')) return { title: 'Edit User', subtitle: 'Modify User' };
    return { title: 'User Details', subtitle: 'View User' };
  }

  return { title: 'Lifestyle Medicine', subtitle: 'Knowledge Platform' };
};

const Header = ({ isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === '/';
  const pageInfo = getPageTitle(location.pathname);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      {/* Mobile App Bar - Fixed for reliable scroll behavior */}
      <header className="lg:hidden bg-secondary-900 text-white fixed top-0 left-0 right-0 z-40 safe-area-top shadow-lg">
        <div className="flex items-center justify-between px-2 h-14">
          {/* Left: Back Button or Logo */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isHomePage ? (
              <>
                <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-white leading-tight truncate">
                    {pageInfo.title}
                  </h1>
                  <p className="text-[10px] text-gray-300 leading-tight truncate">
                    {pageInfo.subtitle}
                  </p>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleBack}
                  className="p-2 -ml-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold text-white leading-tight truncate">
                    {pageInfo.title}
                  </h1>
                  <p className="text-[10px] text-gray-300 leading-tight truncate">
                    {pageInfo.subtitle}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center flex-shrink-0">
            {/* Notifications */}
            <div className="[&_button]:text-white [&_button]:hover:bg-white/10 [&_button]:active:bg-white/20">
              <NotificationDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 lg:px-8 py-4">
          {/* Left: Collapse Toggle + Title */}
          <div className="flex items-center gap-3">
            {/* Desktop Collapse Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5 text-gray-600" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Title */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-primary-700">
                Knowledge Platform
              </h1>
              <p className="text-sm text-gray-600">
                Lifestyle Medicine & Gospel Medical Evangelism
              </p>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-1 -m-1 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
              </Link>
              <Link
                to="/profile"
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                title="Profile Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
