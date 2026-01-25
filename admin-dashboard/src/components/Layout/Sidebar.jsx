import { NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut, User, Shield } from 'lucide-react';
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
} from 'lucide-react';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { confirmLogout } from '../../lib/swal';

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      logout();
      navigate('/login');
    }
  };

  // Role labels for display
  const roleLabels = {
    admin: 'Administrator',
    editor: 'Editor',
    viewer: 'Viewer',
  };

  // All navigation items for mobile grid
  const mobileNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'bg-blue-500' },
    { to: '/conditions', icon: HeartPulse, label: 'Conditions', color: 'bg-red-500' },
    { to: '/interventions', icon: Activity, label: 'Interventions', color: 'bg-green-500' },
    { to: '/care-domains', icon: Bookmark, label: 'Care Domains', color: 'bg-purple-500' },
    { to: '/search', icon: Search, label: 'Search', color: 'bg-gray-500' },
    { to: '/bible', icon: BookOpen, label: 'Bible Explorer', color: 'bg-indigo-500' },
    { to: '/evidence', icon: TestTube, label: 'Evidence', color: 'bg-teal-500' },
    { to: '/references', icon: Library, label: 'References', color: 'bg-amber-500' },
    { to: '/scriptures', icon: Book, label: 'Scriptures', color: 'bg-sky-500' },
    { to: '/egw-references', icon: BookMarked, label: 'EGW Writings', color: 'bg-violet-500' },
    { to: '/recipes', icon: ChefHat, label: 'Recipes', color: 'bg-orange-500' },
    { to: '/profile', icon: Settings, label: 'Settings', color: 'bg-slate-500' },
  ];

  // Admin-only items
  const adminNavItems = [
    { to: '/analytics', icon: BarChart3, label: 'Analytics', color: 'bg-cyan-500', roles: [ROLES.ADMIN] },
    { to: '/users', icon: Users, label: 'Users', color: 'bg-pink-500', roles: [ROLES.ADMIN] },
    { to: '/tags', icon: Tag, label: 'Content Tags', color: 'bg-lime-500', roles: [ROLES.ADMIN] },
    { to: '/import', icon: Upload, label: 'Import Data', color: 'bg-emerald-500', roles: [ROLES.ADMIN] },
    { to: '/ai-generator', icon: Sparkles, label: 'AI Generator', color: 'bg-fuchsia-500', roles: [ROLES.ADMIN] },
  ];

  // Filter admin items based on role
  const filteredAdminItems = adminNavItems.filter(item => !item.roles || hasRole(item.roles));
  const allMobileItems = [...mobileNavItems, ...filteredAdminItems];

  // Desktop navigation sections
  const navSections = [
    {
      title: 'Overview',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: [ROLES.ADMIN] },
        { to: '/search', icon: Search, label: 'Search' },
      ],
    },
    {
      title: 'Content',
      items: [
        { to: '/conditions', icon: HeartPulse, label: 'Conditions' },
        { to: '/interventions', icon: Activity, label: 'Interventions' },
        { to: '/care-domains', icon: Bookmark, label: 'Care Domains' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { to: '/bible', icon: BookOpen, label: 'Bible Explorer' },
        { to: '/evidence', icon: TestTube, label: 'Evidence' },
        { to: '/references', icon: Library, label: 'References' },
        { to: '/scriptures', icon: Book, label: 'Scriptures' },
        { to: '/egw-references', icon: BookMarked, label: 'EGW Writings' },
        { to: '/recipes', icon: ChefHat, label: 'Recipes' },
      ],
    },
    {
      title: 'System',
      roles: [ROLES.ADMIN],
      items: [
        { to: '/users', icon: Users, label: 'Users', roles: [ROLES.ADMIN] },
        { to: '/tags', icon: Tag, label: 'Content Tags', roles: [ROLES.ADMIN] },
        { to: '/import', icon: Upload, label: 'Import Data', roles: [ROLES.ADMIN] },
        { to: '/ai-generator', icon: Sparkles, label: 'AI Generator', roles: [ROLES.ADMIN] },
      ],
    },
    {
      title: 'Account',
      items: [
        { to: '/profile', icon: Settings, label: 'Settings' },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - Bottom Sheet Style */}
      <div
        className={`
          lg:hidden fixed inset-x-0 bottom-0 z-50
          bg-white rounded-t-3xl shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : user?.role === 'editor'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user?.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                {roleLabels[user?.role] || 'User'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Grid Menu */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <div className="grid grid-cols-4 gap-2 p-4">
            {allMobileItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-3 rounded-2xl transition-all touch-manipulation ${
                    isActive
                      ? 'bg-primary-50 ring-2 ring-primary-200'
                      : 'hover:bg-gray-50 active:bg-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 ${
                      isActive ? 'bg-primary-500' : item.color
                    }`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${
                      isActive ? 'text-primary-700' : 'text-gray-600'
                    }`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="border-t border-gray-100 p-4 safe-area-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 active:bg-red-200 transition-colors touch-manipulation"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
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
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {/* Section Title */}
              {!isCollapsed && (
                <div className="mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-4">
                    {section.title}
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
                      title={isCollapsed ? item.label : undefined}
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
                        <span className="font-medium text-sm">{item.label}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Info & Logout - fixed at bottom */}
        <div className={`border-t border-secondary-800 p-4 ${isCollapsed ? 'p-2' : ''}`}>
          {/* User Info */}
          <NavLink
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-secondary-800 hover:text-white ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? user?.name || 'Profile' : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
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
                    {roleLabels[user?.role] || 'User'}
                  </span>
                </div>
              </div>
            )}
          </NavLink>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-red-600/20 hover:text-red-400 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-medium text-sm">Sign Out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
