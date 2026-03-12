import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * React context for in-app notification management.
 * Provides state and methods for adding, reading, and clearing notifications.
 * Notifications are persisted in localStorage (up to 20 items).
 * @type {React.Context<NotificationContextValue|null>}
 */
const NotificationContext = createContext(null);

/**
 * Enumeration of notification categories.
 * @enum {string}
 */
export const NOTIFICATION_TYPES = {
  AI_GENERATION: 'ai_generation',
  IMPORT: 'import',
  SYSTEM: 'system',
};

/**
 * Enumeration of notification status levels.
 * @enum {string}
 */
export const NOTIFICATION_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
};

/** @constant {string} STORAGE_KEY - localStorage key for persisted notifications. */
const STORAGE_KEY = 'app_notifications';

/** @constant {number} MAX_NOTIFICATIONS - Maximum number of notifications kept in storage. */
const MAX_NOTIFICATIONS = 20;

/**
 * Notification provider component that manages a list of in-app notifications.
 * Persists notifications to localStorage and provides methods for CRUD operations.
 *
 * Provides via context:
 *   - notifications {Array} - All notification objects
 *   - unreadCount {number} - Count of unread notifications
 *   - addNotification {Function} - Add a new notification
 *   - markAsRead {Function} - Mark a single notification as read
 *   - markAllAsRead {Function} - Mark all notifications as read
 *   - removeNotification {Function} - Remove a single notification
 *   - clearAll {Function} - Remove all notifications
 *   - notifyAiGeneration {Function} - Helper for AI generation notifications
 *   - notifyImport {Function} - Helper for import notifications
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {React.ReactElement} Provider wrapping children with notification context
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      setUnreadCount(notifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  // Add a new notification
  const addNotification = useCallback(({ type, status, title, message, data = {} }) => {
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      status,
      title,
      message,
      data,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });

    return notification.id;
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Remove a single notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper: Add AI generation notification
  const notifyAiGeneration = useCallback(
    ({ success, conditionName, message }) => {
      return addNotification({
        type: NOTIFICATION_TYPES.AI_GENERATION,
        status: success ? NOTIFICATION_STATUS.SUCCESS : NOTIFICATION_STATUS.ERROR,
        title: success ? 'AI Generation Complete' : 'AI Generation Failed',
        message: message || (success
          ? `Content for "${conditionName}" has been generated successfully.`
          : `Failed to generate content for "${conditionName}".`),
        data: { conditionName },
      });
    },
    [addNotification]
  );

  // Helper: Add import notification
  const notifyImport = useCallback(
    ({ success, type, imported, skipped, message }) => {
      return addNotification({
        type: NOTIFICATION_TYPES.IMPORT,
        status: success ? NOTIFICATION_STATUS.SUCCESS : NOTIFICATION_STATUS.ERROR,
        title: success ? 'Import Complete' : 'Import Failed',
        message: message || (success
          ? `Imported ${imported} ${type}${imported !== 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} skipped` : ''}.`
          : `Failed to import ${type}.`),
        data: { type, imported, skipped },
      });
    },
    [addNotification]
  );

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    notifyAiGeneration,
    notifyImport,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to access the notification context.
 * Must be used within a NotificationProvider.
 *
 * @returns {NotificationContextValue} The notification context value
 * @throws {Error} If used outside of a NotificationProvider
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
