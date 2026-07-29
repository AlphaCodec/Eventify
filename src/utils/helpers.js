/**
 * Eventify – Helper utilities
 */

/** Format a date string to a readable form */
export function formatDate(dateString, options = {}) {
  const defaults = { month: 'long', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', { ...defaults, ...options });
}

/** Short date: Jul 15, 2025 */
export function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Long date: Tuesday, July 15, 2025 */
export function formatLongDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format time from HH:MM to 12h AM/PM */
export function formatTime(timeString) {
  if (!timeString) return '';
  const [h, m] = timeString.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Format currency */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/** Capacity percentage */
export function capacityPercent(attendees, capacity) {
  return Math.min(Math.round((attendees / capacity) * 100), 100);
}

/** Remaining spots */
export function spotsLeft(attendees, capacity) {
  return Math.max(0, capacity - attendees);
}

/** Generate a unique ID */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Generate avatar URL */
export function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128`;
}

/** Truncate text */
export function truncate(str, length = 120) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
}

/** Debounce */
export function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
