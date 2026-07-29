import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const EventContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// Notify all admin users about a pending event.
//
// Why NOT using supabase.rpc('notify_admins_pending_event') here:
//  - .rpc() returns {data, error} and NEVER throws — errors are silently dropped
//  - SECURITY DEFINER RPCs can resolve permissions differently between the
//    initial INSERT (createEvent) and a subsequent UPDATE (updateEvent/resubmit)
//  - Direct .insert() is transparent: errors surface immediately and are logged
// ─────────────────────────────────────────────────────────────────────────────
async function notifyAdminsPendingEvent({ eventId, eventTitle, creatorName }) {
  // Step 1: get all admin IDs
  const { data: admins, error: adminsErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (adminsErr) {
    console.warn('[Eventify] Could not fetch admin list for notification:', adminsErr.message);
    return;
  }
  if (!admins?.length) return; // no admins registered yet

  // Step 2: insert one notification per admin
  const rows = admins.map(a => ({
    user_id: a.id,
    type:    'event_pending_approval',
    title:   '📋 New Event Awaiting Approval',
    message: `${creatorName} submitted "${eventTitle}" for approval.`,
    data:    { event_id: eventId, event_title: eventTitle },
  }));

  const { error: notifErr } = await supabase.from('notifications').insert(rows);
  if (notifErr) {
    console.warn('[Eventify] Failed to insert admin notifications:', notifErr.message);
  }
}

export function EventProvider({ children }) {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  // ── Fetch published events ────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from('events')
      .select('*, profiles!created_by(name, avatar_url)', { count: 'exact' })
      .eq('status', 'published')
      .order('date', { ascending: true });

    if (!error) { setEvents(data || []); setTotal(count || 0); }
    setLoading(false);
  }, []);

  // Safety-net: tab focus + reconnect + every 90 s
  useRealtimeSync(fetchEvents, { interval: 90_000, enabled: true });

  // ── Realtime: granular INSERT / UPDATE / DELETE handlers ──────────────────
  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'events',
      }, (payload) => {
        if (payload.new?.status === 'published') {
          setEvents(prev => {
            if (prev.find(e => e.id === payload.new.id)) return prev;
            return [...prev, payload.new].sort((a, b) => new Date(a.date) - new Date(b.date));
          });
          setTotal(t => t + 1);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'events',
      }, (payload) => {
        const updated = payload.new;
        if (updated.status === 'published') {
          setEvents(prev => {
            const exists = prev.find(e => e.id === updated.id);
            if (exists) return prev.map(e => e.id === updated.id ? { ...e, ...updated } : e);
            return [...prev, updated].sort((a, b) => new Date(a.date) - new Date(b.date));
          });
        } else {
          setEvents(prev => {
            const existed = prev.find(e => e.id === updated.id);
            if (!existed) return prev;
            setTotal(t => Math.max(0, t - 1));
            return prev.filter(e => e.id !== updated.id);
          });
        }
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'events',
      }, (payload) => {
        setEvents(prev => {
          const existed = prev.find(e => e.id === payload.old.id);
          if (existed) setTotal(t => Math.max(0, t - 1));
          return prev.filter(e => e.id !== payload.old.id);
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchEvents]);

  // ── Fetch pending (admin) ─────────────────────────────────────────────────
  const fetchPendingEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles!created_by(name, avatar_url, email)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  // ── Fetch organiser's own events ──────────────────────────────────────────
  const fetchMyEvents = async (userId) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  // ── Paginated + filtered ──────────────────────────────────────────────────
  const queryEvents = async ({ category, search, sort, page = 1, limit = 9 } = {}) => {
    let query = supabase
      .from('events')
      .select('*, profiles!created_by(name, avatar_url)', { count: 'exact' })
      .eq('status', 'published');

    if (category && category !== 'All Events') query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);

    switch (sort) {
      case 'date_desc':  query = query.order('date', { ascending: false }); break;
      case 'price_asc':  query = query.order('price', { ascending: true  }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'popular':    query = query.order('attendees', { ascending: false }); break;
      default:           query = query.order('date', { ascending: true   });
    }
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0, pages: Math.ceil((count || 0) / limit) };
  };

  // ── Create event ──────────────────────────────────────────────────────────
  const createEvent = async (formData, userId, imageFile = null, userRole = 'user') => {
    let imageUrl = formData.image_url || '';

    if (imageFile) {
      const ext  = imageFile.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('event-images')
        .upload(path, imageFile, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const isPrivileged = userRole === 'admin' || userRole === 'organizer';
    let finalStatus;
    if (formData.status === 'draft')    { finalStatus = 'draft'; }
    else if (isPrivileged)              { finalStatus = 'published'; }
    else                                { finalStatus = 'pending'; }

    const payload = {
      title:        formData.title,
      category:     formData.category,
      description:  formData.description,
      date:         formData.date,
      time:         formData.time,
      location:     formData.location,
      city:         formData.city,
      image_url:    imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
      price:        parseFloat(formData.price)     || 0,
      price_vip:    parseFloat(formData.price_vip) || parseFloat(formData.price) * 2.5 || 0,
      capacity:     parseInt(formData.capacity)    || 100,
      organizer:    formData.organizer || '',
      tags:         typeof formData.tags === 'string'
                      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                      : (formData.tags || []),
      status:       finalStatus,
      submitted_at: finalStatus === 'pending' ? new Date().toISOString() : null,
      created_by:   userId,
    };

    const { data, error } = await supabase.from('events').insert(payload).select().single();
    if (error) throw error;

    // Notify all admins — direct insert, no RPC
    if (finalStatus === 'pending') {
      const { data: creator } = await supabase
        .from('profiles').select('name').eq('id', userId).single();

      await notifyAdminsPendingEvent({
        eventId:     data.id,
        eventTitle:  data.title,
        creatorName: creator?.name || 'A user',
      });
    }

    return { event: data, status: finalStatus };
  };

  // ── Update event ──────────────────────────────────────────────────────────
  const updateEvent = async (id, fields, imageFile = null) => {
    let imageUrl = fields.image_url;

    if (imageFile) {
      const ext  = imageFile.name.split('.').pop();
      const path = `${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('event-images').upload(path, imageFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const goingPending = fields.status === 'pending';

    const payload = {
      ...fields,
      ...(imageUrl !== undefined && { image_url: imageUrl }),
      price:        fields.price     !== undefined ? parseFloat(fields.price)     : undefined,
      price_vip:    fields.price_vip !== undefined ? parseFloat(fields.price_vip) : undefined,
      capacity:     fields.capacity  !== undefined ? parseInt(fields.capacity)    : undefined,
      tags:         fields.tags !== undefined
                      ? (typeof fields.tags === 'string'
                          ? fields.tags.split(',').map(t => t.trim()).filter(Boolean)
                          : fields.tags)
                      : undefined,
      updated_at:   new Date().toISOString(),
      // Bump submitted_at so admin sees this as the newest submission
      ...(goingPending && { submitted_at: new Date().toISOString() }),
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
      .select('*, profiles!created_by(name, id)')
      .single();
    if (error) throw error;

    // Notify admins on every submission — initial OR resubmission after rejection/edit.
    // Uses direct insert (not RPC) so errors are surfaced and never silently swallowed.
    if (goingPending) {
      // Resolve creator name: prefer the joined profile, fall back to a separate query
      let creatorName = data.profiles?.name;
      if (!creatorName && data.created_by) {
        const { data: creator } = await supabase
          .from('profiles').select('name').eq('id', data.created_by).single();
        creatorName = creator?.name;
      }

      await notifyAdminsPendingEvent({
        eventId:     id,
        eventTitle:  data.title,
        creatorName: creatorName || 'A user',
      });
    }

    return data;
  };

  // ── Approve event ─────────────────────────────────────────────────────────
  const approveEvent = async (eventId) => {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'published', rejection_reason: null, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select('*, profiles!created_by(name)')
      .single();
    if (error) throw error;

    if (data.created_by) {
      await supabase.from('notifications').insert({
        user_id: data.created_by,
        type:    'event_approved',
        title:   '✅ Event Approved!',
        message: `Your event "${data.title}" has been approved and is now live.`,
        data:    { event_id: eventId },
      });
    }
    return data;
  };

  // ── Reject event ──────────────────────────────────────────────────────────
  const rejectEvent = async (eventId, reason = '') => {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select('*, profiles!created_by(name)')
      .single();
    if (error) throw error;

    if (data.created_by) {
      await supabase.from('notifications').insert({
        user_id: data.created_by,
        type:    'event_rejected',
        title:   '❌ Event Needs Revision',
        message: `Your event "${data.title}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
        data:    { event_id: eventId, reason },
      });
    }
    return data;
  };

  // ── Delete event ──────────────────────────────────────────────────────────
  const deleteEvent = async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  };

  // ── Toggle featured ───────────────────────────────────────────────────────
  const toggleFeatured = async (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    const { data, error } = await supabase
      .from('events')
      .update({ featured: !event.featured, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  // ── Attendee counts ───────────────────────────────────────────────────────
  const incrementAttendees = async (eventId, qty) => {
    await supabase.rpc('increment_attendees', { event_id: eventId, qty });
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, attendees: Math.min((e.attendees||0) + qty, e.capacity) } : e
    ));
  };

  const decrementAttendees = async (eventId, qty) => {
    await supabase.rpc('decrement_attendees', { event_id: eventId, qty });
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, attendees: Math.max(0, (e.attendees||0) - qty) } : e
    ));
  };

  const getEventById = (id) => events.find(e => e.id === id) || null;

  const fetchEventById = async (id) => {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles!created_by(name, avatar_url, bio)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  };

  return (
    <EventContext.Provider value={{
      events, loading, total,
      fetchEvents, queryEvents, fetchPendingEvents, fetchMyEvents,
      createEvent, updateEvent, deleteEvent,
      approveEvent, rejectEvent,
      toggleFeatured, incrementAttendees, decrementAttendees,
      getEventById, fetchEventById,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within <EventProvider>');
  return ctx;
}
