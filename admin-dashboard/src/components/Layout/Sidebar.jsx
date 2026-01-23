import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  LayoutDashboard,
  Heart,
  Activity,
  Book,
  BookMarked,
  ChefHat,
  Bookmark,
  Tag,
  TestTube,
  Library,
  Settings,
  Search,
  Upload,
  Users,
} from 'lucide-react';

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const navSections = [
    {
      title: 'Overview',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/search', icon: Search, label: 'Search' },
      ],
    },
    {
      title: 'Content',
      items: [
        { to: '/conditions', icon: Heart, label: 'Conditions' },
        { to: '/interventions', icon: Activity, label: 'Interventions' },
        { to: '/care-domains', icon: Bookmark, label: 'Care Domains' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { to: '/evidence', icon: TestTube, label: 'Evidence' },
        { to: '/references', icon: Library, label: 'References' },
        { to: '/scriptures', icon: Book, label: 'Scriptures' },
        { to: '/egw-references', icon: BookMarked, label: 'EGW Writings' },
        { to: '/recipes', icon: ChefHat, label: 'Recipes' },
      ],
    },
    {
      title: 'System',
      items: [
        { to: '/users', icon: Users, label: 'Users' },
        { to: '/tags', icon: Tag, label: 'Content Tags' },
        { to: '/import', icon: Upload, label: 'Import Data' },
        { to: '/profile', icon: Settings, label: 'Settings' },
      ],
    },
  ];

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

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full bg-secondary-900 text-white
          transform transition-all duration-300 ease-in-out
          overflow-y-auto sidebar-scroll
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo & Close Button */}
        <div className={`p-4 sm:p-6 border-b border-secondary-800 flex items-center ${isCollapsed ? 'lg:justify-center lg:p-4' : 'justify-between'}`}>
          {/* Logo - full on mobile, conditional on desktop */}
          <div className={`${isCollapsed ? 'lg:hidden' : ''}`}>
            <img
              src="/lifestyle.png"
              alt="Family & Lifestyle Medicine"
              className="w-full h-auto max-w-[180px]"
            />
          </div>
          {/* Collapsed logo icon - desktop only */}
          {isCollapsed && (
            <div className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600">
              <Heart className="w-6 h-6 text-white" />
            </div>
          )}
          {/* Close button - visible only on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-secondary-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`p-3 sm:p-4 ${isCollapsed ? 'lg:p-2' : ''}`}>
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {/* Section Title */}
              <div
                className={`mb-2 ${isCollapsed ? 'lg:hidden' : ''}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 sm:px-4">
                  {section.title}
                </span>
              </div>
              {/* Collapsed divider - desktop only */}
              {isCollapsed && sectionIndex > 0 && (
                <div className="hidden lg:block mb-2 mx-auto w-8 border-t border-secondary-700" />
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
                        `flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg transition-colors duration-200 touch-manipulation ${
                          isCollapsed ? 'lg:px-0 lg:justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-300 hover:bg-secondary-800 hover:text-white active:bg-secondary-700'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className={`font-medium text-sm ${isCollapsed ? 'lg:hidden' : ''}`}>
                        {item.label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
