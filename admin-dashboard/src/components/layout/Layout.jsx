import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden w-full">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-300 pt-14 lg:pt-0 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Header
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-x-hidden w-full max-w-full pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
};

export default Layout;
