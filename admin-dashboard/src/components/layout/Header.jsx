import { useState, useRef, useEffect } from 'react';
import { User, Settings, PanelLeftClose, PanelLeft, HeartPulse, ChevronLeft, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationDropdown from './NotificationDropdown';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { confirmLogout } from '../../lib/swal';

// Page title mapping using i18n keys
const getPageTitleKey = (pathname) => {
  const routes = {
    '/': 'lifestyleMedicine',
    '/conditions': 'conditions',
    '/interventions': 'interventions',
    '/care-domains': 'careDomains',
    '/search': 'search',
    '/bible': 'bible',
    '/evidence': 'evidence',
    '/references': 'references',
    '/scriptures': 'scriptures',
    '/egw-references': 'egwReferences',
    '/recipes': 'recipes',
    '/profile': 'profile',
    '/analytics': 'analytics',
    '/users': 'users',
    '/tags': 'tags',
    '/import': 'import',
    '/ai-generator': 'aiGenerator',
  };

  // Check for exact match first
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith('/conditions/')) {
    if (pathname.includes('/edit')) return 'editCondition';
    if (pathname.includes('/interventions/attach')) return 'attachIntervention';
    return 'conditionDetails';
  }
  if (pathname.startsWith('/interventions/')) {
    if (pathname.includes('/edit')) return 'editIntervention';
    return 'interventionDetails';
  }
  if (pathname.startsWith('/recipes/')) {
    if (pathname.includes('/edit')) return 'editRecipe';
    if (pathname === '/recipes/new') return 'newRecipe';
    return 'recipeDetails';
  }
  if (pathname.startsWith('/scriptures/')) {
    if (pathname.includes('/edit')) return 'editScripture';
    return 'scriptureDetails';
  }
  if (pathname.startsWith('/egw-references/')) {
    if (pathname.includes('/edit')) return 'editEgwReference';
    return 'egwReferenceDetails';
  }
  if (pathname.startsWith('/evidence/')) {
    if (pathname.includes('/edit')) return 'editEvidence';
    return 'evidenceDetails';
  }
  if (pathname.startsWith('/references/')) {
    if (pathname.includes('/edit')) return 'editReference';
    return 'referenceDetails';
  }
  if (pathname.startsWith('/care-domains/')) {
    if (pathname.includes('/edit')) return 'editCareDomain';
    return 'careDomainDetails';
  }
  if (pathname.startsWith('/users/')) {
    if (pathname.includes('/edit')) return 'editUser';
    return 'userDetails';
  }

  return 'lifestyleMedicine';
};

const Header = ({ isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['navigation', 'common']);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isHomePage = location.pathname === '/';
  const pageKey = getPageTitleKey(location.pathname);
  const pageInfo = {
    title: t(`navigation:pages.${pageKey}.title`),
    subtitle: t(`navigation:pages.${pageKey}.subtitle`),
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    const confirmed = await confirmLogout();
    if (confirmed) {
      logout();
      navigate('/login');
    }
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
                  aria-label={t('navigation:header.goBack')}
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
              aria-label={isCollapsed ? t('navigation:header.expandSidebar') : t('navigation:header.collapseSidebar')}
              title={isCollapsed ? t('navigation:header.expandSidebar') : t('navigation:header.collapseSidebar')}
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
                {t('navigation:header.title')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('navigation:header.subtitle')}
              </p>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher variant="header" />

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="relative pl-4 border-l border-gray-200" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
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
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    {t('navigation:user.settings')}
                  </Link>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('navigation:user.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
