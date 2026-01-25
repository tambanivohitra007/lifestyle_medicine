import { NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut, User, Shield, ChevronRight } from 'lucide-react';
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

  // Mobile navigation sections with gradients
  const mobileSections = [
    {
      title: 'Main',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', gradient: 'from-blue-500 to-blue-600' },
        { to: '/search', icon: Search, label: 'Search', gradient: 'from-slate-500 to-slate-600' },
      ],
    },
    {
      title: 'Content',
      items: [
        { to: '/conditions', icon: HeartPulse, label: 'Conditions', gradient: 'from-rose-500 to-red-600' },
        { to: '/interventions', icon: Activity, label: 'Interventions', gradient: 'from-emerald-500 to-green-600' },
        { to: '/care-domains', icon: Bookmark, label: 'Care Domains', gradient: 'from-violet-500 to-purple-600' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { to: '/bible', icon: BookOpen, label: 'Bible Explorer', gradient: 'from-indigo-500 to-indigo-600' },
        { to: '/scriptures', icon: Book, label: 'Scriptures', gradient: 'from-sky-500 to-cyan-600' },
        { to: '/egw-references', icon: BookMarked, label: 'EGW Writings', gradient: 'from-purple-500 to-violet-600' },
        { to: '/evidence', icon: TestTube, label: 'Evidence', gradient: 'from-teal-500 to-teal-600' },
        { to: '/references', icon: Library, label: 'References', gradient: 'from-amber-500 to-orange-600' },
        { to: '/recipes', icon: ChefHat, label: 'Recipes', gradient: 'from-orange-500 to-red-500' },
      ],
    },
    {
      title: 'Administration',
      roles: [ROLES.ADMIN],
      items: [
        { to: '/analytics', icon: BarChart3, label: 'Analytics', gradient: 'from-cyan-500 to-blue-600', roles: [ROLES.ADMIN] },
        { to: '/users', icon: Users, label: 'Users', gradient: 'from-pink-500 to-rose-600', roles: [ROLES.ADMIN] },
        { to: '/tags', icon: Tag, label: 'Tags', gradient: 'from-lime-500 to-green-600', roles: [ROLES.ADMIN] },
        { to: '/import', icon: Upload, label: 'Import', gradient: 'from-emerald-500 to-teal-600', roles: [ROLES.ADMIN] },
        { to: '/ai-generator', icon: Sparkles, label: 'AI Generator', gradient: 'from-fuchsia-500 to-pink-600', roles: [ROLES.ADMIN] },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - Elegant Bottom Sheet */}
      <div
        className={`
          lg:hidden fixed inset-x-0 bottom-0 z-50
          bg-gradient-to-b from-white to-gray-50 rounded-t-[2rem] shadow-2xl
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header - User Profile Card */}
        <div className="mx-4 mt-2 mb-4 p-4 bg-gradient-to-r from-secondary-800 to-secondary-900 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{user?.name || 'User'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    user?.role === 'admin'
                      ? 'bg-purple-500/30 text-purple-200'
                      : user?.role === 'editor'
                      ? 'bg-blue-500/30 text-blue-200'
                      : 'bg-gray-500/30 text-gray-200'
                  }`}>
                    {user?.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                    {roleLabels[user?.role] || 'User'}
                  </span>
                </div>
              </div>
            </div>
            <NavLink
              to="/profile"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors touch-manipulation"
            >
              <Settings className="w-5 h-5 text-white" />
            </NavLink>
          </div>
        </div>

        {/* Scrollable Menu */}
        <div className="overflow-y-auto overscroll-contain px-4 pb-2" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {filteredMobileSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-5' : ''}>
              {/* Section Title */}
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
                {section.title}
              </p>

              {/* Section Items - Horizontal scroll for Resources, Grid for others */}
              {section.items.length > 4 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex-shrink-0 flex flex-col items-center justify-center w-[72px] py-3 rounded-2xl transition-all duration-200 touch-manipulation ${
                          isActive
                            ? 'bg-primary-50 shadow-md shadow-primary-100'
                            : 'bg-white shadow-sm hover:shadow-md active:scale-95'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 shadow-sm bg-gradient-to-br ${
                            isActive ? 'from-primary-500 to-primary-600' : item.gradient
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
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-200 touch-manipulation ${
                          isActive
                            ? 'bg-primary-50 shadow-md shadow-primary-100'
                            : 'bg-white shadow-sm hover:shadow-md active:scale-95'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 shadow-sm bg-gradient-to-br ${
                            isActive ? 'from-primary-500 to-primary-600' : item.gradient
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
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 p-4 bg-white safe-area-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium text-sm shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 active:scale-[0.98] transition-all duration-200 touch-manipulation"
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
