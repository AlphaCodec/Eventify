import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Star, Share2, Heart, ArrowLeft, Clock, Tag, Shield } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import PaymentModal from '../components/PaymentModal';
import ReviewSection from '../components/ReviewSection';

const swalConfig = { background: '#1e1e2e', color: '#f0f0fa', confirmButtonColor: '#7c5cfc' };

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBooking } = useBooking();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [ticketType, setTicketType] = useState('standard');
  const [showPayment, setShowPayment] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch(`/events/${id}`)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid var(--surface-2)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading event...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 12 }}>Event Not Found</h2>
          <button onClick={() => navigate('/events')} className="btn-outline">Back to Events</button>
        </div>
      </div>
    );
  }

  const price = ticketType === 'vip' ? event.priceVip : event.price;
  const totalPrice = price * ticketQuantity;

  const handleBookNow = () => {
    if (!user) {
      Swal.fire({ ...swalConfig, title: 'Login Required', text: 'Please login to book tickets', icon: 'warning', showCancelButton: true, confirmButtonText: 'Login' })
        .then((r) => { if (r.isConfirmed) navigate('/login'); });
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (stripePaymentId) => {
    setShowPayment(false);
    try {
      await addBooking({
        userId: user.id, eventId: event._id, eventTitle: event.title,
        eventDate: event.date, eventImage: event.image,
        ticketType, quantity: ticketQuantity, totalPrice, stripePaymentId,
      });
      Swal.fire({
        ...swalConfig, title: 'Booking Confirmed! 🎉',
        html: `<p style="color:#8888aa">Your tickets are secured.</p>
               <div style="margin-top:16px;padding:16px;background:#1c1c2a;border-radius:10px;text-align:left">
                 <p style="color:white;font-weight:600;margin-bottom:6px">${event.title}</p>
                 <p style="color:#8888aa;font-size:13px">${ticketQuantity}× ${ticketType.toUpperCase()} · $${totalPrice.toFixed(2)}</p>
               </div>`,
        icon: 'success',
      }).then(() => navigate('/dashboard'));
    } catch (err) {
      Swal.fire({ ...swalConfig, title: 'Error saving booking', text: err.message, icon: 'error' });
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const capacity = event.capacity || 1;
  const fillPct = Math.min(100, Math.round(((event.attendees || 0) / capacity) * 100));

  const categoryColors = {
    Music: '#9d82ff', Technology: '#93c5fd', Food: '#fcd34d',
    Sports: '#6ee7b7', Arts: '#f9a8d4', Business: '#7dd3fc',
  };
  const catColor = categoryColors[event.category] || '#9d82ff';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      {showPayment && (
        <PaymentModal event={event} ticketType={ticketType} quantity={ticketQuantity}
          totalPrice={totalPrice} onSuccess={handlePaymentSuccess} onClose={() => setShowPayment(false)} />
      )}

      {/* Hero Image */}
      <div style={{ height: 420, position: 'relative', overflow: 'hidden' }}>
        <img src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200'}
          alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.4) 50%, transparent 100%)' }} />

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Overlaid title */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 40px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: catColor + '25', color: catColor, border: `1px solid ${catColor}40` }}>
                {event.category}
              </span>
              {event.featured && <span className="tag tag-amber" style={{ fontSize: 12 }}>✦ Featured</span>}
            </div>
            <h1 className="font-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 8 }}>
              {event.title}
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)' }}>Organized by <span style={{ color: 'white', fontWeight: 600 }}>{event.organizer}</span></p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' }}>

          {/* Left: Details */}
          <div>
            {/* Quick info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 36 }}>
              {[
                { icon: Calendar, label: 'Date', value: formatDate(event.date) },
                { icon: Clock, label: 'Time', value: event.time || 'TBA' },
                { icon: MapPin, label: 'Location', value: `${event.location}, ${event.city}` },
                { icon: Users, label: 'Capacity', value: `${event.attendees ?? 0} / ${event.capacity} attending` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,92,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="var(--violet-light)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 14, color: 'white', fontWeight: 500, lineHeight: 1.4 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Capacity bar */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Capacity</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: fillPct > 80 ? '#f87171' : 'var(--violet-light)' }}>{fillPct}% filled</span>
              </div>
              <div style={{ height: 6, background: 'var(--ink-3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct > 80 ? '#ef4444' : 'var(--violet)', borderRadius: 99, transition: 'width 1s ease' }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{event.capacity - (event.attendees ?? 0)} spots remaining</p>
            </div>

            {/* About */}
            <div style={{ marginBottom: 32 }}>
              <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 14 }}>About this Event</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div>
                <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 14 }}>Tags</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {event.tags.map((tag, i) => (
                    <span key={i} className="tag tag-surface" style={{ fontSize: 13 }}>
                      <Tag size={11} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Review Section — attendance-gated, API-backed */}
            <ReviewSection eventId={event._id} user={user} />
          </div>

          {/* Right: Booking sidebar */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
              {/* Header */}
              <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Starting from</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="font-display" style={{ fontSize: 32, fontWeight: 800, color: 'white' }}>${price}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ ticket</span>
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {/* Ticket type */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Ticket Type</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label
                      className={`ticket-option ${ticketType === 'standard' ? 'selected' : ''}`}
                      onClick={() => setTicketType('standard')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="radio" name="ticketType" value="standard" checked={ticketType === 'standard'} onChange={() => setTicketType('standard')} style={{ accentColor: 'var(--violet)' }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>Standard</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--violet-light)' }}>${event.price}</span>
                    </label>
                    {event.priceVip > 0 && (
                      <label
                        className={`ticket-option ${ticketType === 'vip' ? 'selected' : ''}`}
                        onClick={() => setTicketType('vip')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="radio" name="ticketType" value="vip" checked={ticketType === 'vip'} onChange={() => setTicketType('vip')} style={{ accentColor: 'var(--violet)' }} />
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>VIP ✦</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>${event.priceVip}</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Quantity</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                      onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                      style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ink-3)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--violet)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >−</button>
                    <span className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'white', minWidth: 32, textAlign: 'center' }}>{ticketQuantity}</span>
                    <button
                      onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                      style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ink-3)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--violet)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >+</button>
                  </div>
                </div>

                {/* Price breakdown */}
                <div style={{ background: 'var(--ink-3)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>${price} × {ticketQuantity}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>${(price * ticketQuantity).toFixed(2)}</span>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Total</span>
                    <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--violet-light)' }}>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* CTA */}
                <button onClick={handleBookNow} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 16, marginBottom: 12 }}>
                  Book & Pay Now
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSaved(!saved)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 500, color: saved ? '#f472b6' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <Heart size={15} fill={saved ? '#f472b6' : 'none'} /> {saved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={() => navigator.share?.({ title: event.title, url: window.location.href }) || navigator.clipboard?.writeText(window.location.href)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <Share2 size={15} /> Share
                  </button>
                </div>

                {/* Trust badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, color: 'var(--text-muted)', fontSize: 12 }}>
                  <Shield size={12} /> 256-bit SSL · Powered by Stripe
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
