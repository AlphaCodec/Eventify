import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const { user } = useAuth();
  const [bookings,    setBookings] = useState([]);
  const [allBookings, setAll]      = useState([]);
  const [loading,     setLoading]  = useState(false);

  // ── Fetch current user's bookings ─────────────────────────────────────────
  const fetchMyBookings = useCallback(async () => {
    if (!user?.id) { setBookings([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(title, date, time, city, location, image_url, organizer)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setBookings(data || []);
    setLoading(false);
  }, [user?.id]);

  // ── Safety-net sync on tab focus / reconnect ─────────────────────────────
  useRealtimeSync(fetchMyBookings, { interval: 120_000, enabled: !!user?.id });

  // ── Realtime subscription ───────────────
  useEffect(() => {
    fetchMyBookings();
    if (!user?.id) return;

    const channel = supabase
      .channel(`bookings-user-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchMyBookings())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchMyBookings, user?.id]);

  // ── Fetch all bookings (admin) ─────────────────────────────────────────────
  const fetchAllBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(title, date, city), profiles!user_id(name, email, avatar_url)')
      .order('created_at', { ascending: false });
    if (!error) setAll(data || []);
    return data || [];
  };

  // ── Create booking ─────────────────────────────────────────────────────────
  const createBooking = async ({ ticketType, quantity }, event) => {
    if (!user?.id) throw new Error('Must be logged in to book');

    const pricePerTicket = ticketType === 'vip' ? event.price_vip : event.price;
    const totalPrice     = pricePerTicket * quantity;
    const bookingRef     = `EVT-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id:          user.id,
        event_id:         event.id,
        ticket_type:      ticketType,
        quantity,
        price_per_ticket: pricePerTicket,
        total_price:      totalPrice,
        status:           'confirmed',
        booking_ref:      bookingRef,
      })
      .select('*, events(title, date, time, city, location, image_url, organizer)')
      .single();

    if (error) throw error;

    // Realtime will pick this up automatically — optimistic update for instant UI
    setBookings(prev => [data, ...prev]);

    await supabase.from('notifications').insert({
      user_id: user.id,
      type:    'booking_confirmed',
      title:   'Booking Confirmed!',
      message: `Your booking for "${event.title}" is confirmed. Ref: ${bookingRef}`,
      data:    { booking_id: data.id, event_id: event.id },
    });

    return data;
  };

  // ── Cancel booking ─────────────────────────────────────────────────────────
  const cancelBooking = async (bookingId) => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) throw error;
    // Realtime will sync — also update local state immediately
    setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
    return data;
  };

  const getUserBookings  = (userId) => bookings.filter(b => b.user_id === userId);
  const getEventBookings = (eventId) => allBookings.filter(b => b.event_id === eventId && b.status === 'confirmed');
  const hasBooking       = (userId, eventId) =>
    bookings.some(b => b.user_id === userId && b.event_id === eventId && b.status === 'confirmed');

  const totalRevenue = allBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <BookingContext.Provider value={{
      bookings, allBookings, loading,
      createBooking, cancelBooking,
      fetchMyBookings, fetchAllBookings,
      getUserBookings, getEventBookings,
      hasBooking, totalRevenue,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used within <BookingProvider>');
  return ctx;
}
