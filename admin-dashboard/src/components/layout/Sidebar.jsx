import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Book,
  BookMarked,
  BookOpen,
  ChefHat,
  Bookmark,
  Tag,
  TestTube,
  Library,
  Settings,
  Search,
  Upload,
  Users,
  BarChart3,
  Sparkles,
  Network,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { confirmLogout } from '../../lib/swal';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['navigation', 'common']);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      logout();
      navigate('/login');
    }
  };

  // Role labels for display - now using i18n
  const getRoleLabel = (role) => t(`navigation:user.roles.${role}`, { defaultValue: 'User' });

  // Mobile navigation sections
  const mobileSections = [
    {
      titleKey: 'sections.main',
      items: [
        { to: '/', icon: LayoutDashboard, labelKey: 'menu.dashboard' },
        { to: '/search', icon: Search, labelKey: 'menu.search' },
        { to: '/knowledge-graph', icon: Network, labelKey: 'menu.graph' },
      ],
    },
    {
      titleKey: 'sections.content',
      items: [
        { to: '/conditions', icon: HeartPulse, labelKey: 'menu.conditions' },
        { to: '/interventions', icon: Activity, labelKey: 'menu.interventions' },
        { to: '/care-domains', icon: Bookmark, labelKey: 'menu.careDomains' },
      ],
    },
    {
      titleKey: 'sections.resources',
      items: [
        { to: '/bible', icon: BookOpen, labelKey: 'menu.bible' },
        { to: '/scriptures', icon: Book, labelKey: 'menu.scriptures' },
        { to: '/egw-references', icon: BookMarked, labelKey: 'menu.egwWritings' },
        { to: '/evidence', icon: TestTube, labelKey: 'menu.evidence' },
        { to: '/references', icon: Library, labelKey: 'menu.references' },
        { to: '/recipes', icon: ChefHat, labelKey: 'menu.recipes' },
      ],
    },
    {
      titleKey: 'sections.administration',
      roles: [ROLES.ADMIN],
      items: [
        { to: '/analytics', icon: BarChart3, labelKey: 'menu.analytics', roles: [ROLES.ADMIN] },
        { to: '/users', icon: Users, labelKey: 'menu.users', roles: [ROLES.ADMIN] },
        { to: '/tags', icon: Tag, labelKey: 'menu.tags', roles: [ROLES.ADMIN] },
        { to: '/import', icon: Upload, labelKey: 'menu.import', roles: [ROLES.ADMIN] },
        { to: '/ai-generator', icon: Sparkles, labelKey: 'menu.aiGenerator', roles: [ROLES.ADMIN] },
      ],
    },
  ];

  // Filter sections based on role
  const filteredMobileSections = mobileSections
    .filter(section => !section.roles || hasRole(section.roles))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || hasRole(item.roles)),
    }))
    .filter(section => section.items.length > 0);

  // Desktop navigation sections
  const navSections = [
    {
      titleKey: 'sections.overview',
      items: [
        { to: '/', icon: LayoutDashboard, labelKey: 'menu.dashboard' },
        { to: '/analytics', icon: BarChart3, labelKey: 'menu.analytics', roles: [ROLES.ADMIN] },
        { to: '/search', icon: Search, labelKey: 'menu.search' },
        { to: '/knowledge-graph', icon: Network, labelKey: 'menu.knowledgeGraph' },
      ],
    },
    {
      titleKey: 'sections.content',
      items: [
        { to: '/conditions', icon: HeartPulse, labelKey: 'menu.conditions' },
        { to: '/interventions', icon: Activity, labelKey: 'menu.interventions' },
        { to: '/care-domains', icon: Bookmark, labelKey: 'menu.careDomains' },
      ],
    },
    {
      titleKey: 'sections.resources',
      items: [
        { to: '/bible', icon: BookOpen, labelKey: 'menu.bible' },
        { to: '/evidence', icon: TestTube, labelKey: 'menu.evidence' },
        { to: '/references', icon: Library, labelKey: 'menu.references' },
        { to: '/scriptures', icon: Book, labelKey: 'menu.scriptures' },
        { to: '/egw-references', icon: BookMarked, labelKey: 'menu.egwWritings' },
        { to: '/recipes', icon: ChefHat, labelKey: 'menu.recipes' },
      ],
    },
    {
      titleKey: 'sections.system',
      roles: [ROLES.ADMIN],
      items: [
        { to: '/users', icon: Users, labelKey: 'menu.users', roles: [ROLES.ADMIN] },
        { to: '/tags', icon: Tag, labelKey: 'menu.tags', roles: [ROLES.ADMIN] },
        { to: '/import', icon: Upload, labelKey: 'menu.import', roles: [ROLES.ADMIN] },
        { to: '/ai-generator', icon: Sparkles, labelKey: 'menu.aiGenerator', roles: [ROLES.ADMIN] },
      ],
    },
  ];

  // Filter sections and items based on user role
  const filteredSections = navSections
    .filter(section => !section.roles || hasRole(section.roles))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || hasRole(item.roles)),
    }))
    .filter(section => section.items.length > 0);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - Clean Bottom Sheet */}
      <div
        className={`
          lg:hidden fixed inset-x-0 bottom-0 z-50
          bg-white rounded-t-2xl shadow-2xl
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header - Minimal User Profile */}
        <div className="mx-4 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                <span className={`inline-flex items-center gap-1 text-xs ${
                  user?.role === 'admin'
                    ? 'text-primary-600'
                    : user?.role === 'editor'
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}>
                  {user?.role === 'admin' && <Shield className="w-3 h-3" />}
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>
            <NavLink
              to="/profile"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <Settings className="w-5 h-5" />
            </NavLink>
          </div>
        </div>

        {/* Scrollable Menu - Clean List Layout */}
        <div className="overflow-y-auto overscroll-contain px-4 pb-2" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {filteredMobileSections.map((section, sectionIndex) => (
            <div key={section.titleKey} className={sectionIndex > 0 ? 'mt-4' : ''}>
              {/* Section Title */}
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1 px-3">
                {t(`navigation:${section.titleKey}`)}
              </p>

              {/* Section Items - Vertical List */}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 touch-manipulation ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <item.icon className="w-4.5 h-4.5" />
                        </div>
                        <span className={`text-sm font-medium ${
                          isActive ? 'text-primary-700' : 'text-gray-700'
                        }`}>
                          {t(`navigation:${item.labelKey}`)}
                        </span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-100 px-4 py-3 safe-area-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 font-medium text-sm transition-colors duration-150 touch-manipulation"
          >
            <LogOut className="w-4 h-4" />
            {t('navigation:user.signOut')}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex fixed left-0 top-0 z-50 h-full bg-secondary-900 text-white
          transform transition-all duration-300 ease-in-out
          flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className={`p-4 sm:p-6 border-b border-secondary-800 flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between'}`}>
          {!isCollapsed && (
            <img
              src="/lifestyle.png"
              alt="Family & Lifestyle Medicine"
              className="w-full h-auto max-w-[180px]"
            />
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Navigation - scrollable */}
        <nav className={`flex-1 overflow-y-auto sidebar-scroll p-4 ${isCollapsed ? 'p-2' : ''}`}>
          {filteredSections.map((section, sectionIndex) => (
            <div key={section.titleKey} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {/* Section Title */}
              {!isCollapsed && (
                <div className="mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-4">
                    {t(`navigation:${section.titleKey}`)}
                  </span>
                </div>
              )}
              {/* Collapsed divider */}
              {isCollapsed && sectionIndex > 0 && (
                <div className="mb-2 mx-auto w-8 border-t border-secondary-700" />
              )}

              {/* Section Items */}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      title={isCollapsed ? t(`navigation:${item.labelKey}`) : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                          isCollapsed ? 'px-0 justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium text-sm">{t(`navigation:${item.labelKey}`)}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Info & Logout - fixed at bottom */}
        <div className={`border-t border-secondary-800 p-4 ${isCollapsed ? 'p-2' : ''}`} ref={dropdownRef}>
          <div className="relative">
            {/* Profile Button - Toggles Dropdown */}
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-secondary-800 hover:text-white ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title={isCollapsed ? user?.name || 'Profile' : undefined}
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        user?.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300'
                          : user?.role === 'editor'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {user?.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                        {getRoleLabel(user?.role)}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className={`absolute bottom-full mb-2 ${isCollapsed ? 'left-full ml-2' : 'left-0 right-0'} bg-secondary-800 rounded-lg shadow-lg overflow-hidden min-w-[160px]`}>
                <NavLink
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-secondary-700 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  {t('navigation:user.settings')}
                </NavLink>
                <LanguageSwitcher variant="sidebar" showLabel={true} />
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('navigation:user.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
