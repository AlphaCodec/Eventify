import Swal from 'sweetalert2';

/**
 * Reusable confirmation dialogs using SweetAlert2
 */
export function useConfirm() {
  const confirm = async ({ title, text, confirmText = 'Confirm', danger = false }) => {
    const result = await Swal.fire({
      title,
      text,
      icon: danger ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancel',
      confirmButtonColor: danger ? '#ef4444' : '#6366f1',
      cancelButtonColor: '#9ca3af',
      borderRadius: '16px',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl font-semibold',
        cancelButton: 'rounded-xl font-semibold',
      },
    });
    return result.isConfirmed;
  };

  const alert = async ({ title, text, icon = 'success' }) => {
    await Swal.fire({
      title,
      text,
      icon,
      confirmButtonColor: '#6366f1',
      customClass: { confirmButton: 'rounded-xl font-semibold' },
    });
  };

  return { confirm, alert };
}
