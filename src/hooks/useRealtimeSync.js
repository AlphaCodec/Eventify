/**
 * useRealtimeSync
 *
 * Two-layer safety net on top of Supabase Realtime WebSocket:
 *
 * Layer A — EVENT-DRIVEN triggers (instant, no polling cost):
 *   1. Tab becomes visible again (user returns after being away)
 *   2. Browser regains internet connection (after offline period)
 *
 * Layer B — INTERVAL POLL (safety net for silent WebSocket drops):
 *   3. Configurable interval (default 90s) as last resort
 *
 * Features:
 * - 8-second debounce to prevent hammering when triggers fire rapidly
 * - Skips polling when tab is hidden (no wasted requests in background)
 * - Disabled when user is not logged in (enabled=false)
 * - Cleans up all listeners and timers on unmount
 */
import { useEffect, useRef, useCallback } from 'react';

export function useRealtimeSync(refreshFn, {
  interval = 90_000,
  enabled  = true,
} = {}) {
  const lastRefreshRef = useRef(0);      // 0 = never refreshed via this hook
  const timerRef       = useRef(null);
  const enabledRef     = useRef(enabled);
  const refreshFnRef   = useRef(refreshFn);

  // Keep refs current without recreating the refresh callback
  useEffect(() => { enabledRef.current = enabled; },   [enabled]);
  useEffect(() => { refreshFnRef.current = refreshFn; }, [refreshFn]);

  const refresh = useCallback(async () => {
    if (!enabledRef.current || !refreshFnRef.current) return;
    // Skip if tab is hidden — the visibilitychange handler will catch it on return
    if (document.visibilityState === 'hidden') return;
    const now = Date.now();
    if (now - lastRefreshRef.current < 8_000) return; // 8s debounce
    lastRefreshRef.current = now;
    try { await refreshFnRef.current(); } catch { /* ignore */ }
  }, []); // stable — deps are in refs

  useEffect(() => {
    if (!enabled) {
      clearInterval(timerRef.current);
      return;
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', refresh);

    // Stagger the interval start by 15s so it doesn't collide with initial fetch
    const startTimer = setTimeout(() => {
      timerRef.current = setInterval(refresh, interval);
    }, 15_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', refresh);
      clearTimeout(startTimer);
      clearInterval(timerRef.current);
    };
  }, [enabled, interval, refresh]); // refresh is stable, so this only re-runs if enabled/interval changes
}
