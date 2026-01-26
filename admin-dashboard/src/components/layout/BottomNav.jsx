import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Search,
  Menu,
} from 'lucide-react';

const BottomNav = ({ onMenuClick }) => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/conditions', icon: HeartPulse, label: 'Conditions' },
    { to: '/interventions', icon: Activity, label: 'Interventions' },
    { to: '/search', icon: Search, label: 'Search' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 active:text-gray-700'
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* More Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full px-2 text-gray-500 active:text-gray-700 transition-colors touch-manipulation"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
