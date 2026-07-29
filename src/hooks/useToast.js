import toast from 'react-hot-toast';

export function useToast() {
  const success = (msg) =>
    toast.success(msg, {
      duration: 3000,
      style: {
        borderRadius: '12px',
        background: '#1a1a2e',
        color: '#fff',
        fontWeight: '600',
        fontSize: '14px',
      },
      iconTheme: { primary: '#10b981', secondary: '#fff' },
    });

  const error = (msg) =>
    toast.error(msg, {
      duration: 3500,
      style: {
        borderRadius: '12px',
        background: '#1a1a2e',
        color: '#fff',
        fontWeight: '600',
        fontSize: '14px',
      },
      iconTheme: { primary: '#ef4444', secondary: '#fff' },
    });

  const warning = (msg) =>
    toast(msg, {
      duration: 3000,
      icon: '⚠️',
      style: {
        borderRadius: '12px',
        background: '#1a1a2e',
        color: '#fff',
        fontWeight: '600',
        fontSize: '14px',
      },
    });

  const info = (msg) =>
    toast(msg, {
      duration: 3000,
      icon: 'ℹ️',
      style: {
        borderRadius: '12px',
        background: '#1a1a2e',
        color: '#fff',
        fontWeight: '600',
        fontSize: '14px',
      },
    });

  return { success, error, warning, info };
}
