/**
 * @module swal
 * SweetAlert2 wrapper providing pre-configured toast notifications,
 * confirmation dialogs, and loading indicators with consistent theming.
 * All dialog text is i18n-aware via react-i18next.
 */
import Swal from 'sweetalert2';
import i18n from '../i18n';

/** @constant {Object} theme - Color palette matching the Tailwind CSS config. */
const theme = {
  primary: '#2563eb',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
};

// Helper to get translations
const t = (key, options) => i18n.t(key, options);

/**
 * Auto-dismissing toast notifications displayed at the top-right corner.
 * Each method accepts a message string and shows a styled toast.
 *
 * @property {Function} success - Show a success toast (3s).
 * @property {Function} error - Show an error toast (4s).
 * @property {Function} warning - Show a warning toast (3.5s).
 * @property {Function} info - Show an info toast (3s).
 */
export const toast = {
  success: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
    });
  },

  error: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
    });
  },

  warning: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: message,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
    });
  },

  info: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
    });
  },
};

/**
 * Displays a confirmation dialog for delete operations with a danger-themed confirm button.
 * @param {string} [itemName='this item'] - The name of the item being deleted (shown in the message)
 * @returns {Promise<boolean>} Resolves to true if the user confirmed, false otherwise
 */
export const confirmDelete = async (itemName = 'this item') => {
  const result = await Swal.fire({
    title: t('common:confirmation.deleteTitle'),
    html: `${t('common:confirmation.deleteMessage', { item: itemName })}<br><small class="text-gray-500">${t('common:confirmation.deleteWarning')}</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: theme.danger,
    cancelButtonColor: '#6b7280',
    confirmButtonText: t('common:confirmation.yesDelete'),
    cancelButtonText: t('common:buttons.cancel'),
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
      cancelButton: 'rounded-lg px-4 py-2',
    },
  });

  return result.isConfirmed;
};

/**
 * Displays a confirmation dialog for remove/detach operations (e.g., unlinking a relationship).
 * @param {string} [message] - Optional custom message (defaults to i18n common remove message)
 * @returns {Promise<boolean>} Resolves to true if the user confirmed, false otherwise
 */
export const confirmRemove = async (message) => {
  const result = await Swal.fire({
    title: t('common:confirmation.removeTitle'),
    text: message || t('common:messages.confirmRemove'),
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: theme.warning,
    cancelButtonColor: '#6b7280',
    confirmButtonText: t('common:confirmation.yesRemove'),
    cancelButtonText: t('common:buttons.cancel'),
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
      cancelButton: 'rounded-lg px-4 py-2',
    },
  });

  return result.isConfirmed;
};

/**
 * Displays a general-purpose confirmation dialog.
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message body
 * @param {string} [confirmText] - Custom confirm button text (defaults to i18n "Confirm")
 * @returns {Promise<boolean>} Resolves to true if the user confirmed, false otherwise
 */
export const confirm = async (title, message, confirmText) => {
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: theme.primary,
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText || t('common:buttons.confirm'),
    cancelButtonText: t('common:buttons.cancel'),
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
      cancelButton: 'rounded-lg px-4 py-2',
    },
  });

  return result.isConfirmed;
};

/**
 * Displays a modal error alert with an OK button.
 * @param {string} message - Error message to display
 * @param {string} [title] - Optional custom title (defaults to i18n status label)
 * @returns {Promise<SweetAlertResult>} The SweetAlert2 result
 */
export const showError = (message, title) => {
  return Swal.fire({
    title: title || t('common:labels.status'),
    text: message,
    icon: 'error',
    confirmButtonColor: theme.primary,
    confirmButtonText: t('common:buttons.ok'),
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
    },
  });
};

/**
 * Displays a modal success alert that auto-dismisses after 2 seconds.
 * @param {string} message - Success message to display
 * @param {string} [title] - Optional custom title (defaults to i18n status label)
 * @returns {Promise<SweetAlertResult>} The SweetAlert2 result
 */
export const showSuccess = (message, title) => {
  return Swal.fire({
    title: title || t('common:labels.status'),
    text: message,
    icon: 'success',
    confirmButtonColor: theme.primary,
    confirmButtonText: t('common:buttons.ok'),
    timer: 2000,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
    },
  });
};

/**
 * Shows a non-dismissable loading spinner dialog.
 * Call hideLoading() to close it.
 * @param {string} [message] - Optional loading message (defaults to i18n "Please wait")
 */
export const showLoading = (message) => {
  Swal.fire({
    title: message || t('common:messages.pleaseWait'),
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: 'rounded-2xl',
    },
  });
};

/**
 * Closes the currently open SweetAlert2 dialog (e.g., loading spinner).
 */
export const hideLoading = () => {
  Swal.close();
};

/**
 * Displays a confirmation dialog specifically for logout operations.
 * @returns {Promise<boolean>} Resolves to true if the user confirmed logout, false otherwise
 */
export const confirmLogout = async () => {
  const result = await Swal.fire({
    title: t('auth:logout.title'),
    text: t('auth:logout.message'),
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: theme.danger,
    cancelButtonColor: '#6b7280',
    confirmButtonText: t('auth:logout.confirmButton'),
    cancelButtonText: t('common:buttons.cancel'),
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
      cancelButton: 'rounded-lg px-4 py-2',
    },
  });

  return result.isConfirmed;
};

// Export Swal for advanced usage
export { Swal };
