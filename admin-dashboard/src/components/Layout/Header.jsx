import { User, Settings, PanelLeftClose, PanelLeft, HeartPulse } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile App Bar */}
      <header className="lg:hidden bg-secondary-900 text-white sticky top-0 z-30 safe-area-top">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                Lifestyle Medicine
              </h1>
              <p className="text-[10px] text-gray-300 leading-tight">
                Knowledge Platform
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center">
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
