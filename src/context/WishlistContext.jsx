import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading,     setLoading]     = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user?.id) { setWishlistIds(new Set()); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlist')
      .select('event_id')
      .eq('user_id', user.id);
    if (!error) setWishlistIds(new Set((data || []).map(w => w.event_id)));
    setLoading(false);
  }, [user?.id]);

  // Safety-net: re-fetch on tab focus / reconnect
  useRealtimeSync(fetchWishlist, { interval: 120_000, enabled: !!user?.id });

  useEffect(() => {
    fetchWishlist();
    if (!user?.id) return;

    const channel = supabase
      .channel(`wishlist-user-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'wishlist',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        // payload.new always has event_id on INSERT
        if (payload.new?.event_id) {
          setWishlistIds(prev => new Set([...prev, payload.new.event_id]));
        }
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'wishlist',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        // BUG FIX: payload.old may only contain the PK if replica identity is
        // not FULL. So we cannot rely on payload.old.event_id here.
        // Always do a full re-fetch on DELETE to stay in sync safely.
        fetchWishlist();
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'wishlist',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchWishlist())
      .subscribe((status) => {
        // If subscription fails, fall back to polling via useRealtimeSync
        if (status === 'CHANNEL_ERROR') fetchWishlist();
      });

    return () => supabase.removeChannel(channel);
  }, [fetchWishlist, user?.id]);

  const toggleWishlist = async (eventId) => {
    if (!user?.id) return false;
    const isIn = wishlistIds.has(eventId);

    // Optimistic update first
    setWishlistIds(prev => {
      const next = new Set(prev);
      isIn ? next.delete(eventId) : next.add(eventId);
      return next;
    });

    if (isIn) {
      const { error } = await supabase
        .from('wishlist').delete()
        .eq('user_id', user.id).eq('event_id', eventId);
      if (error) { fetchWishlist(); return false; } // revert on error
      return false;
    } else {
      const { error } = await supabase
        .from('wishlist').insert({ user_id: user.id, event_id: eventId });
      if (error) { fetchWishlist(); return false; }
      return true;
    }
  };

  const isWishlisted    = (eventId) => wishlistIds.has(eventId);
  const getUserWishlist = () => [...wishlistIds];

  return (
    <WishlistContext.Provider value={{
      wishlistIds, loading,
      toggleWishlist, isWishlisted,
      getUserWishlist, fetchWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within <WishlistProvider>');
  return ctx;
}
