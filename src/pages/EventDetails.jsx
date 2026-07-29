import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Users, Clock, Share2, Heart,
  ChevronLeft, Tag, Minus, Plus, CreditCard,
  CheckCircle, Star, User, ExternalLink, AlertCircle,
} from 'lucide-react';
import { useEvents } from '../context/EventContext';
import { useBookings } from '../context/BookingContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ReviewSection from '../components/ReviewSection';
import PaymentModal from '../components/PaymentModal';
import {
  formatLongDate, formatTime, formatCurrency,
  capacityPercent, spotsLeft,
} from '../utils/helpers';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const TABS = ['About', 'Reviews', 'Details'];

export default function EventDetails() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { fetchEventById } = useEvents();
  const { hasBooking }     = useBookings();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user }   = useAuth();

  const [event, setEvent]         = useState(null);
  const [evLoad, setEvLoad]       = useState(true);
  const [tab, setTab]             = useState('About');
  const [ticketType, setType]     = useState('standard');
  const [qty, setQty]             = useState(1);
  const [showPayment, setPayment] = useState(false);
  const [justBooked, setJustBooked] = useState(false);

  // ── Initial fetch ────────────────────────────────────────────────────────
  const loadEvent = useCallback(async () => {
    const d = await fetchEventById(id);
    setEvent(d);
    setEvLoad(false);
  }, [id, fetchEventById]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  // ── Realtime: patch local state when this specific event changes ──────────
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`event-detail-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'events',
        filter: `id=eq.${id}`,
      }, (payload) => {
        setEvent(prev => prev ? { ...prev, ...payload.new } : prev);
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'events',
        filter: `id=eq.${id}`,
      }, () => {
        // Event was deleted — go back
        toast.error('This event is no longer available.');
        navigate('/events');
      })
      .subscribe();

    // Also re-fetch when tab regains focus (catches missed events)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadEvent();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [id, loadEvent, navigate]);

  if (evLoad) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">😕</div>
      <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Event not found</h2>
      <Link to="/events" className="btn-primary">Back to Events</Link>
    </div>
  );

  const now       = new Date();
  const eventDate = new Date(event.date);
  const isPast    = eventDate < now;
  const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
  const isSoon    = !isPast && daysUntil <= 7;

  const price      = ticketType === 'vip' ? event.price_vip : event.price;
  const total      = price * qty;
  const pct        = capacityPercent(event.attendees||0, event.capacity||1);
  const spots      = spotsLeft(event.attendees||0, event.capacity||1);
  const soldOut    = spots === 0;
  const booked     = justBooked || (user ? hasBooking(user.id, event.id) : false);
  const wishlisted = user ? isWishlisted(event.id) : false;
  const imageUrl   = event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop';

  const handleWishlist = async () => {
    if (!user) { toast.error('Please log in to save events.'); navigate('/login'); return; }
    const added = await toggleWishlist(event.id);
    toast.success(added ? '❤️ Saved to wishlist!' : 'Removed from wishlist.');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleBookClick = () => {
    if (!user) { toast.error('Please sign in to book.'); navigate('/login', { state: { from: `/events/${id}` } }); return; }
    if (soldOut) { toast.error('Sorry, this event is sold out!'); return; }
    setPayment(true);
  };

  const handlePaymentSuccess = (booking) => {
    setPayment(false);
    setJustBooked(true);
    setEvent(prev => ({ ...prev, attendees: Math.min((prev.attendees||0)+qty, prev.capacity) }));
    toast.success('🎉 Booking confirmed! Your e-ticket is ready in your dashboard.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={imageUrl} alt={event.title} className={`w-full h-full object-cover ${isPast ? 'grayscale-[30%]' : ''}`} />
        <div className={`absolute inset-0 bg-gradient-to-t ${isPast ? 'from-black/80 via-black/40' : 'from-black/70 via-black/20'} to-transparent`} />

        {/* Past event ribbon */}
        {isPast && (
          <div className="absolute top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm text-center py-2">
            <p className="text-white/80 text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              This event took place on {formatLongDate(event.date)} — it has now ended
            </p>
          </div>
        )}

        {/* Soon ribbon */}
        {isSoon && !isPast && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-center py-2">
            <p className="text-white text-xs font-semibold flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {daysUntil === 0 ? 'Happening today!' : `Only ${daysUntil} day${daysUntil > 1 ? 's' : ''} away — book now!`}
            </p>
          </div>
        )}

        <div className="absolute top-14 left-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium transition-all">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <div className="absolute top-14 right-4 flex gap-2">
          {!isPast && (
            <button onClick={handleWishlist}
              className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}>
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-white' : ''}`} />
            </button>
          )}
          <button onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          {event.featured && !isPast && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-1 rounded-full mb-2">
              <Star className="w-3 h-3 fill-white" /> Featured Event
            </span>
          )}
          {isPast && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-gray-700/80 text-white px-3 py-1 rounded-full mb-2">
              <CheckCircle className="w-3 h-3 text-green-400" /> Completed Event
            </span>
          )}
          <h1 className="font-display text-2xl md:text-4xl font-extrabold text-white leading-tight">{event.title}</h1>
          <p className="text-white/80 text-sm mt-1">{event.category} · {event.city}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left info */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { icon: Calendar, text: formatLongDate(event.date) },
                { icon: Clock,    text: formatTime(event.time) },
                { icon: MapPin,   text: `${event.location}, ${event.city}` },
                { icon: Users,    text: `${(event.attendees||0).toLocaleString()} / ${(event.capacity||0).toLocaleString()} attendees` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-800">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isPast ? 'text-gray-400' : 'text-primary-500'}`} /><span>{text}</span>
                </div>
              ))}
            </div>

            {/* Capacity */}
            {!isPast && (
              <div className="card p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{pct}% capacity filled</span>
                  <span className={`font-semibold ${spots < 20 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                    {soldOut ? '⚠️ Sold out' : `${spots} spots left`}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${pct>=90?'bg-red-500':pct>=70?'bg-yellow-500':'bg-green-500'}`}
                    initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:'easeOut'}} />
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab===t ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}>{t}</button>
              ))}
            </div>

            {tab === 'About' && (
              <div className="card p-6">
                <h3 className="font-display text-lg font-bold mb-3 text-gray-900 dark:text-white">About this Event</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                {event.organizer && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
                    <div>
                      <p className="text-xs text-gray-400">Organized by</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{event.organizer}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'Reviews' && (
              <div className="card p-6">
                <h3 className="font-display text-lg font-bold mb-6 text-gray-900 dark:text-white">Reviews</h3>
                {isPast && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 mb-4 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>This event has ended. Attendees can now leave their review below.</span>
                  </div>
                )}
                <ReviewSection eventId={event.id} />
              </div>
            )}
            {tab === 'Details' && (
              <div className="card p-6 space-y-1">
                <h3 className="font-display text-lg font-bold mb-3 text-gray-900 dark:text-white">Event Details</h3>
                {[
                  ['Category',  event.category],
                  ['Status',    isPast ? 'Completed ✓' : 'Upcoming'],
                  ['Date',      formatLongDate(event.date)],
                  ['Time',      formatTime(event.time)],
                  ['Location',  event.location],
                  ['City',      event.city],
                  ['Capacity',  (event.capacity||0).toLocaleString()],
                  ['Attended',  (event.attendees||0).toLocaleString()],
                  ['Organizer', event.organizer],
                  ['Standard',  formatCurrency(event.price)],
                  ['VIP',       formatCurrency(event.price_vip)],
                ].filter(([,v])=>v).map(([label,value])=>(
                  <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                    <span className={`text-sm font-semibold ${label==='Status' && isPast ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>{value}</span>
                  </div>
                ))}
                {event.tags?.length > 0 && (
                  <div className="pt-3"><p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map(t=><span key={t} className="inline-flex items-center gap-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full"><Tag className="w-3 h-3"/>{t}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: booking widget */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              {isPast ? (
                /* ── Past event panel ── */
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <h3 className="font-display text-base font-bold text-gray-900 dark:text-white mb-1">Event Completed</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    This event ended on {formatLongDate(event.date)}.<br />
                    {(event.attendees||0).toLocaleString()} people attended.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Total attended</span>
                      <span className="font-bold text-gray-900 dark:text-white">{(event.attendees||0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Capacity</span>
                      <span className="font-bold text-gray-900 dark:text-white">{(event.capacity||0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Fill rate</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{pct}%</span>
                    </div>
                  </div>
                  {booked ? (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        You attended this event!
                      </div>
                      <button onClick={() => document.querySelector('[data-tab="Reviews"]')?.click() || setTab('Reviews')}
                        className="btn-primary w-full text-sm py-2.5">Leave a Review</button>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">Bookings are no longer available for this event.</p>
                  )}
                </div>
              ) : booked ? (
                /* ── Already booked ── */
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 dark:text-white">You're booked!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your e-ticket & QR code are ready in your dashboard.</p>
                  <Link to="/dashboard" className="btn-primary mt-4 w-full flex items-center justify-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4" /> View My Booking
                  </Link>
                </div>
              ) : (
                /* ── Book now ── */
                <>
                  <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">Book Tickets</h3>
                  <div className="space-y-2 mb-5">
                    {[{value:'standard',label:'Standard',price:event.price},{value:'vip',label:'⭐ VIP',price:event.price_vip}].map(opt=>(
                      <button key={opt.value} onClick={()=>setType(opt.value)}
                        className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${ticketType===opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                        <span>{opt.label}</span><span className="font-bold">{formatCurrency(opt.price)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mb-5">
                    <label className="form-label">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <span className="text-lg font-bold leading-none">−</span>
                      </button>
                      <span className="font-bold text-gray-900 dark:text-white text-lg w-8 text-center">{qty}</span>
                      <button onClick={()=>setQty(q=>Math.min(Math.min(spots,10),q+1))} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <span className="text-lg font-bold leading-none">+</span>
                      </button>
                    </div>
                  </div>
                  {isSoon && !soldOut && (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 mb-4 text-xs text-amber-700 dark:text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {daysUntil === 0 ? 'Event is today!' : `Happening in ${daysUntil} day${daysUntil>1?'s':''}!`} Book soon.
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-t border-b border-gray-100 dark:border-gray-800 mb-5">
                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                  </div>
                  <button onClick={handleBookClick} disabled={soldOut}
                    className="btn-primary w-full py-3.5 text-base shadow-glow flex items-center justify-center gap-2 disabled:opacity-60">
                    <CreditCard className="w-5 h-5" />{soldOut ? 'Sold Out' : `Book Now · ${formatCurrency(total)}`}
                  </button>
                  {!user && <p className="text-xs text-center text-gray-400 mt-3"><Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold">Sign in</Link> to complete booking</p>}
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>🔒</span> Secured by Stripe
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal event={event} ticketType={ticketType} quantity={qty}
          onClose={() => setPayment(false)} onSuccess={handlePaymentSuccess} />
      )}
    </div>
  );
}
