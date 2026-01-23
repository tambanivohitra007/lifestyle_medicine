import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Heart,
  Activity,
  FileText,
  Book,
  ChefHat,
  Bookmark,
  Tag,
  TestTube,
  Library,
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/conditions', icon: Heart, label: 'Conditions' },
    { to: '/interventions', icon: Activity, label: 'Interventions' },
    { to: '/care-domains', icon: Bookmark, label: 'Care Domains' },
    { to: '/evidence', icon: TestTube, label: 'Evidence' },
    { to: '/references', icon: Library, label: 'References' },
    { to: '/scriptures', icon: Book, label: 'Scriptures' },
    { to: '/recipes', icon: ChefHat, label: 'Recipes' },
    { to: '/tags', icon: Tag, label: 'Content Tags' },
  ];

  return (
    <aside className="w-64 bg-secondary-900 text-white min-h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-secondary-800">
        <img
          src="/lifestyle.png"
          alt="Family & Lifestyle Medicine"
          className="w-full h-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
