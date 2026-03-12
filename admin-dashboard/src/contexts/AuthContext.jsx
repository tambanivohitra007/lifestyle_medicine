import { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';

/**
 * React context for authentication state management.
 * Provides user data, token, role helpers, and session timeout handling.
 * @type {React.Context<AuthContextValue|undefined>}
 */
const AuthContext = createContext();

/**
 * Enumeration of available user roles in the application.
 * @enum {string}
 */
export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

/** @constant {number} SESSION_TIMEOUT - Session timeout duration in milliseconds (30 minutes of inactivity). */
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

/** @constant {string[]} ACTIVITY_EVENTS - DOM events that reset the inactivity timeout. */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

/**
 * Custom hook to access the authentication context.
 * Must be used within an AuthProvider.
 *
 * @returns {AuthContextValue} The authentication context value containing:
 *   - user {Object|null} - The authenticated user object
 *   - token {string|null} - The bearer auth token
 *   - login {Function} - Stores token/user and starts session
 *   - updateUser {Function} - Updates the stored user data
 *   - logout {Function} - Clears auth state and session
 *   - isAuthenticated {boolean} - Whether a token exists
 *   - loading {boolean} - Whether initial auth check is in progress
 *   - isAdmin {boolean} - Whether the user has the admin role
 *   - isEditor {boolean} - Whether the user has the editor role
 *   - isViewer {boolean} - Whether the user has the viewer role
 *   - canEdit {boolean} - Whether the user can edit (admin or editor)
 *   - hasRole {Function} - Checks if user has one of the specified roles
 * @throws {Error} If used outside of an AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication provider component that manages user sessions, token storage,
 * and automatic session timeout after 30 minutes of inactivity.
 *
 * Stores auth state in localStorage and listens for user activity events
 * to reset the inactivity timer. On timeout, redirects to login.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {React.ReactElement} Provider wrapping children with auth context
 */
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

  /**
   * Stores authentication credentials and starts a new session.
   * @param {string} newToken - The bearer auth token
   * @param {Object} userData - The user profile data
   */
  const login = (newToken, userData) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('last_activity', Date.now().toString());
    setToken(newToken);
    setUser(userData);
  };

  /**
   * Updates the stored user data without changing the token.
   * @param {Object} userData - The updated user profile data
   */
  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Role helper functions
  const isAdmin = useMemo(() => user?.role === ROLES.ADMIN, [user?.role]);
  const isEditor = useMemo(() => user?.role === ROLES.EDITOR, [user?.role]);
  const isViewer = useMemo(() => user?.role === ROLES.VIEWER, [user?.role]);
  const canEdit = useMemo(() => isAdmin || isEditor, [isAdmin, isEditor]);

  /**
   * Checks if the current user has one of the specified roles.
   * @param {string|string[]} roles - A single role string or array of role strings
   * @returns {boolean} True if user's role matches any of the specified roles
   */
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
