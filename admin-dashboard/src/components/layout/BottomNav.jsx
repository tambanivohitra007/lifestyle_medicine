import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Search,
  Menu,
} from 'lucide-react';

const BottomNav = ({ onMenuClick }) => {
  const { t } = useTranslation('navigation');

  const navItems = [
    { to: '/', icon: LayoutDashboard, labelKey: 'menu.home' },
    { to: '/conditions', icon: HeartPulse, labelKey: 'menu.conditions' },
    { to: '/interventions', icon: Activity, labelKey: 'menu.interventions' },
    { to: '/search', icon: Search, labelKey: 'menu.search' },
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
            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
          </NavLink>
        ))}

        {/* More Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full px-2 text-gray-500 active:text-gray-700 transition-colors touch-manipulation"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">{t('menu.more')}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
