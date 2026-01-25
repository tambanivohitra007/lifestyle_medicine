import { createContext, useState, useContext, useEffect, useMemo } from 'react';

const AuthContext = createContext();

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

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

  useEffect(() => {
    // Check if token exists and is valid
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
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
