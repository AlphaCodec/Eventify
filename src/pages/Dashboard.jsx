import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, Heart, DollarSign, QrCode, XCircle, Clock, Camera, Save, Eye, Edit, Plus, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useWishlist } from '../context/WishlistContext';
import { useEvents } from '../context/EventContext';
import { useConfirm } from '../hooks/useConfirm';
import StatCard from '../components/StatCard';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';
import QRTicket from '../components/QRTicket';
import HostInsights from '../components/HostInsights';
import FirstEventModal from '../components/FirstEventModal';
import { formatShortDate, formatTime, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const TABS = ['bookings', 'wishlist', 'my events', 'insights', 'profile'];

const FIRST_EVENT_MODAL_KEY = (userId) => `eventify_first_event_shown_${userId}`;

export default function Dashboard() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const { bookings, cancelBooking, fetchMyBookings } = useBookings();
  const { wishlistIds }                              = useWishlist();
  const { events, decrementAttendees, fetchMyEvents } = useEvents();
  const { confirm }                                  = useConfirm();

  const [tab,           setTab]         = useState('bookings');
  const [qrBooking,     setQrBooking]   = useState(null);
  const [profileForm,   setProfile]     = useState({ name: user?.name||'', bio: user?.bio||'', phone: user?.phone||'' });
  const [saving,        setSaving]      = useState(false);
  const [avatarLoading, setAvL]         = useState(false);
  const [myEvents,      setMyEvents]    = useState([]);
  const [firstEventModal, setFirstEventModal] = useState(null); // null | { title }

  useEffect(() => { fetchMyBookings(); }, []);
  useEffect(() => {
    if (!user?.id) return;
    fetchMyEvents(user.id).then(data => {
      setMyEvents(data);
      // Check if the first-event congratulations popup should show
      const key     = FIRST_EVENT_MODAL_KEY(user.id);
      const shown   = localStorage.getItem(key);
      const published = data.filter(e => e.status === 'published');
      if (!shown && published.length > 0) {
        localStorage.setItem(key, '1');
        // Small delay so the dashboard renders first
        setTimeout(() => setFirstEventModal({ title: published[0].title }), 600);
      }
    }).catch(() => {});

    const channel = supabase
      .channel(`my-events-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `created_by=eq.${user.id}` },
        (payload) => {
          setMyEvents(prev => prev.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e));
          // If a pending event just got approved for the first time, show the modal
          if (payload.new.status === 'published' && payload.old?.status !== 'published') {
            const key   = FIRST_EVENT_MODAL_KEY(user.id);
            const shown = localStorage.getItem(key);
            if (!shown) {
              localStorage.setItem(key, '1');
              setFirstEventModal({ title: payload.new.title });
            }
          }
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events', filter: `created_by=eq.${user.id}` },
        (payload) => {
          setMyEvents(prev => prev.find(e => e.id === payload.new.id) ? prev : [payload.new, ...prev]);
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events', filter: `created_by=eq.${user.id}` },
        (payload) => { setMyEvents(prev => prev.filter(e => e.id !== payload.old.id)); })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  useEffect(() => { if (user) setProfile({ name: user.name||'', bio: user.bio||'', phone: user.phone||'' }); }, [user]);

  const now         = new Date();
  const confirmed   = bookings.filter(b => b.status === 'confirmed');
  const cancelled   = bookings.filter(b => b.status === 'cancelled');
  const totalSpent  = confirmed.reduce((s, b) => s + Number(b.total_price), 0);
  const wishlistEvents = events.filter(e => wishlistIds.has(e.id));
  const publishedMyEvents = myEvents.filter(e => e.status === 'published');
  const hasInsights = publishedMyEvents.length > 0;

  const isEventPast = (b) => b.events?.date && new Date(b.events.date) < now;

  const statusBadge = (b) => {
    if (b.status === 'cancelled') return 'bg-red-100  dark:bg-red-900/40  text-red-700  dark:text-red-300';
    if (b.status === 'confirmed' && isEventPast(b)) return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    if (b.status === 'confirmed') return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
    if (b.status === 'pending')   return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  };

  const statusLabel = (b) => {
    if (b.status === 'confirmed' && isEventPast(b)) return '✓ Attended';
    return b.status.charAt(0).toUpperCase() + b.status.slice(1);
  };

  const handleCancel = async (booking) => {
    const ok = await confirm({ title: 'Cancel Booking?', text: `Cancel booking for "${booking.events?.title}"?`, confirmText: 'Yes, Cancel', danger: true });
    if (!ok) return;
    try { await cancelBooking(booking.id); await decrementAttendees(booking.event_id, booking.quantity); toast.success('Booking cancelled.'); }
    catch { toast.error('Could not cancel booking.'); }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;
    setSaving(true);
    const result = await updateProfile({ name: profileForm.name.trim(), bio: profileForm.bio.trim(), phone: profileForm.phone.trim() });
    setSaving(false);
    result.success ? toast.success('Profile updated!') : toast.error(result.error);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast.error('Image must be under 2 MB.'); return; }
    setAvL(true);
    const result = await uploadAvatar(file);
    setAvL(false);
    result.success ? toast.success('Avatar updated!') : toast.error(result.error);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <img
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=6366f1&color=fff&size=128`}
              alt={user?.name} className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md"
            />
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            {avatarLoading && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white">My Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Ticket}     label="Confirmed"   value={confirmed.length}          color="primary" />
          <StatCard icon={XCircle}    label="Cancelled"   value={cancelled.length}          color="red" />
          <StatCard icon={DollarSign} label="Total Spent" value={formatCurrency(totalSpent)} color="green" />
          <StatCard icon={Heart}      label="Wishlist"    value={wishlistIds.size}          color="accent" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit flex-wrap">
          {TABS.map(t => {
            const isInsights = t === 'insights';
            const disabled   = isInsights && !hasInsights;
            return (
              <button key={t} onClick={() => !disabled && setTab(t)}
                disabled={disabled}
                title={disabled ? 'Host your first published event to unlock insights' : undefined}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all disabled:cursor-not-allowed ${
                  tab === t
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : disabled
                      ? 'text-gray-300 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {isInsights && <BarChart2 className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                {t}
                {isInsights && !hasInsights && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-[9px] font-bold rounded-full flex items-center justify-center">🔒</span>
                )}
                {isInsights && hasInsights && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">✦</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── BOOKINGS ── */}
        {tab === 'bookings' && (
          <div>
            {!bookings.length ? (
              <EmptyState icon="🎫" title="No bookings yet" description="Browse events and book your first one!" action={{ to: '/events', label: 'Explore Events' }} />
            ) : (
              <div className="space-y-4">
                {bookings.map(b => {
                  const ev = b.events || {};
                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex flex-col sm:flex-row gap-4">
                      <img src={ev.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop'} alt={ev.title} className="w-full sm:w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{ev.title}</h3>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(b)}`}>{statusLabel(b)}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">Ref: {b.booking_ref}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{ev.date ? formatShortDate(ev.date) : '—'}</span>
                          <span className="flex items-center gap-1"><Clock    className="w-3.5 h-3.5" />{ev.time ? formatTime(ev.time) : '—'}</span>
                          <span className="capitalize">{b.quantity} × {b.ticket_type}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <span className="font-extrabold text-primary-600 dark:text-primary-400">{formatCurrency(Number(b.total_price))}</span>
                          <div className="flex gap-2">
                            {b.status === 'confirmed' && !isEventPast(b) && (
                              <>
                                <button onClick={() => setQrBooking(b)} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> E-Ticket</button>
                                <button onClick={() => handleCancel(b)} className="text-xs px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Cancel</button>
                              </>
                            )}
                            {b.status === 'confirmed' && isEventPast(b) && (
                              <a href={`/events/${b.event_id}`} className="text-xs px-3 py-1.5 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-1">
                                ⭐ Leave Review
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── WISHLIST ── */}
        {tab === 'wishlist' && (
          <div>
            {!wishlistEvents.length ? (
              <EmptyState icon="❤️" title="Your wishlist is empty" description="Save events to revisit later." action={{ to: '/events', label: 'Explore Events' }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistEvents.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </div>
        )}

        {/* ── MY EVENTS ── */}
        {tab === 'my events' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Events you've created ({myEvents.length})</p>
              <Link to="/create-event" className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Event
              </Link>
            </div>
            {!myEvents.length ? (
              <EmptyState icon="📅" title="No events yet" description="Create your first event to see it here." action={{ to: '/create-event', label: 'Create Event' }} />
            ) : (
              <div className="space-y-3">
                {myEvents.map(ev => {
                  const evStatusBadge = {
                    published: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
                    pending:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
                    rejected:  'bg-red-100   dark:bg-red-900/40   text-red-700   dark:text-red-300',
                    draft:     'bg-gray-100  dark:bg-gray-800      text-gray-600  dark:text-gray-400',
                  }[ev.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`card p-4 flex gap-4 items-start ${ev.status==='rejected'?'border-l-4 border-red-400':ev.status==='pending'?'border-l-4 border-amber-400':''}`}>
                      <img src={ev.image_url||'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop'} alt={ev.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{ev.title}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${evStatusBadge}`}>{ev.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatShortDate(ev.date)} · {ev.city} · {ev.attendees||0}/{ev.capacity||0} attendees</p>
                        {ev.status==='pending' && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting admin approval</p>}
                        {ev.status==='rejected' && (
                          <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs text-red-700 dark:text-red-300">
                            <p className="font-semibold">❌ Rejected{ev.rejection_reason?':':''}</p>
                            {ev.rejection_reason && <p className="mt-0.5 text-red-600 dark:text-red-400">{ev.rejection_reason}</p>}
                            <p className="mt-1 text-red-500 dark:text-red-400">Edit your event and resubmit for review.</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link to={`/events/${ev.id}`} className="p-2 text-gray-400 hover:text-primary-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Eye className="w-4 h-4" /></Link>
                        <Link to={`/create-event/${ev.id}`} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Edit className="w-4 h-4" /></Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {tab === 'insights' && (
          <div>
            {!hasInsights ? (
              <div className="card p-10 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">Insights Locked</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-5">
                  Host and publish your first event to unlock professional organiser insights — revenue tracking, booking analytics, capacity stats, and more.
                </p>
                <Link to="/create-event" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
                  <Plus className="w-4 h-4" /> Create Your First Event
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-gray-900 dark:text-white">Organiser Insights</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Performance overview across all your published events</p>
                  </div>
                  <Link to="/create-event" className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Event
                  </Link>
                </div>
                <HostInsights myEvents={myEvents} userId={user?.id} />
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === 'profile' && (
          <div className="card p-6 max-w-lg">
            <h3 className="font-display text-lg font-bold mb-5 text-gray-900 dark:text-white">Profile Settings</h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              {[{key:'name',label:'Full Name',type:'text',placeholder:'Jane Smith'},{key:'phone',label:'Phone Number',type:'tel',placeholder:'+1 555 000 0000'}].map(f=>(
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input type={f.type} value={profileForm[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} className="input-field" />
                </div>
              ))}
              <div>
                <label className="form-label">Bio</label>
                <textarea value={profileForm.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} placeholder="Tell us a little about yourself…" rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" value={user?.email||''} disabled className="input-field bg-gray-50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email is managed via your authentication provider.</p>
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5">
                <Save className="w-4 h-4" />{saving?'Saving…':'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>

      {qrBooking && <QRTicket booking={qrBooking} onClose={() => setQrBooking(null)} />}

      {/* First Event Congratulations Modal */}
      <AnimatePresence>
        {firstEventModal && (
          <FirstEventModal
            eventTitle={firstEventModal.title}
            onClose={() => { setFirstEventModal(null); setTab('insights'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
