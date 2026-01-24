import { Bell, User, Menu, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Header = ({ onMenuClick, isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Left: Menu Button + Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
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
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-700">
              Knowledge Platform
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              Lifestyle Medicine & Gospel Medical Evangelism
            </p>
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors relative touch-manipulation">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>

          {/* User Menu - Desktop */}
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
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

          {/* User Avatar - Mobile (tapping opens sidebar with logout) */}
          <Link
            to="/profile"
            className="flex sm:hidden p-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          >
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
