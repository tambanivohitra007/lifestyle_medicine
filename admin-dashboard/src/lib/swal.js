import Swal from 'sweetalert2';
import i18n from '../i18n';

// Custom theme colors matching Tailwind config
const theme = {
  primary: '#2563eb',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
};

// Helper to get translations
const t = (key, options) => i18n.t(key, options);

// Toast notification (auto-dismiss)
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

// Confirm delete dialog
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

// Confirm remove/detach dialog
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

// General confirmation dialog
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

// Error alert
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

// Success alert
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

// Loading dialog
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

// Close loading
export const hideLoading = () => {
  Swal.close();
};

// Confirm logout dialog
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
