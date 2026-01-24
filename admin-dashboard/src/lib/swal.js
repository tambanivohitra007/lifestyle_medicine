import Swal from 'sweetalert2';

// Custom theme colors matching Tailwind config
const theme = {
  primary: '#2563eb',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
};

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
    title: 'Delete Confirmation',
    html: `Are you sure you want to delete <strong>${itemName}</strong>?<br><small class="text-gray-500">This action cannot be undone.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: theme.danger,
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
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
export const confirmRemove = async (message = 'Remove this item?') => {
  const result = await Swal.fire({
    title: 'Remove Confirmation',
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: theme.warning,
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, remove it',
    cancelButtonText: 'Cancel',
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
export const confirm = async (title, message, confirmText = 'Confirm') => {
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: theme.primary,
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
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
export const showError = (message, title = 'Error') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'error',
    confirmButtonColor: theme.primary,
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
    },
  });
};

// Success alert
export const showSuccess = (message, title = 'Success') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'success',
    confirmButtonColor: theme.primary,
    confirmButtonText: 'OK',
    timer: 2000,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-lg px-4 py-2',
    },
  });
};

// Loading dialog
export const showLoading = (message = 'Please wait...') => {
  Swal.fire({
    title: message,
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
    title: 'Sign Out',
    text: 'Are you sure you want to sign out?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: theme.danger,
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, sign out',
    cancelButtonText: 'Cancel',
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
