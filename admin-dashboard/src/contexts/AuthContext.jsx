import { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';

const AuthContext = createContext();

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

// Session timeout configuration (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Logout function (defined early for use in timeout)
  const logout = useCallback(() => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear all auth data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');

    setToken(null);
    setUser(null);
  }, []);

  // Reset the inactivity timeout
  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    lastActivityRef.current = Date.now();
    localStorage.setItem('last_activity', lastActivityRef.current.toString());

    // Only set timeout if user is logged in
    if (token) {
      timeoutRef.current = setTimeout(() => {
        logout();
        // Redirect to login with session expired message
        window.location.href = '/login?session=expired';
      }, SESSION_TIMEOUT);
    }
  }, [token, logout]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  // Set up activity listeners
  useEffect(() => {
    if (token) {
      // Check if session has already expired (e.g., user returned after being away)
      const lastActivity = localStorage.getItem('last_activity');
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
        if (timeSinceActivity > SESSION_TIMEOUT) {
          logout();
          window.location.href = '/login?session=expired';
          return;
        }
      }

      // Add activity listeners
      ACTIVITY_EVENTS.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
      });

      // Start the timeout
      resetTimeout();

      return () => {
        // Clean up listeners
        ACTIVITY_EVENTS.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [token, handleActivity, resetTimeout, logout]);

  useEffect(() => {
    // Check if token exists and is valid
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid JSON in localStorage, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('last_activity', Date.now().toString());
    setToken(newToken);
    setUser(userData);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Role helper functions
  const isAdmin = useMemo(() => user?.role === ROLES.ADMIN, [user?.role]);
  const isEditor = useMemo(() => user?.role === ROLES.EDITOR, [user?.role]);
  const isViewer = useMemo(() => user?.role === ROLES.VIEWER, [user?.role]);
  const canEdit = useMemo(() => isAdmin || isEditor, [isAdmin, isEditor]);

  // Check if user has one of the specified roles
  const hasRole = (roles) => {
    if (!user?.role) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    token,
    login,
    updateUser,
    logout,
    isAuthenticated: !!token,
    loading,
    // Role helpers
    isAdmin,
    isEditor,
    isViewer,
    canEdit,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
