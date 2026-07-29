import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) { setNotifications([]); setUnreadCount(0); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  }, [user?.id]);

  useRealtimeSync(fetchNotifications, { interval: 60_000, enabled: !!user?.id });

  useEffect(() => {
    fetchNotifications();
    if (!user?.id) return;

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        if (!payload.new.read) setUnreadCount(c => c + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        // Sync read status across tabs — e.g. user marked all read in another tab
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n)
        );
        // Recompute unread from updated list
        setUnreadCount(prev => {
          const wasUnread = !payload.old?.read;
          const nowRead   = payload.new?.read;
          if (wasUnread && nowRead) return Math.max(0, prev - 1);
          return prev;
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchNotifications, user?.id]);

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationsProvider>');
  return ctx;
}
