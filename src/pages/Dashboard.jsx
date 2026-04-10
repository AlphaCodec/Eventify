import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, Heart, TrendingUp, ArrowUpRight, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const swalConfig = { background: '#1e1e2e', color: '#f0f0fa', confirmButtonColor: '#7c5cfc' };

function Dashboard() {
  const { user } = useAuth();
  const { bookings, fetchUserBookings, cancelBooking } = useBooking();

  useEffect(() => {
    if (user?.id) fetchUserBookings(user.id).catch(console.error);
  }, [user?.id]);

  const handleCancel = (bookingId) => {
    Swal.fire({
      ...swalConfig, title: 'Cancel this booking?',
      text: 'This action cannot be undone.', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await cancelBooking(bookingId);
          Swal.fire({ ...swalConfig, title: 'Cancelled', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ ...swalConfig, title: 'Error', text: err.message, icon: 'error' });
        }
      }
    });
  };

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalSpent = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.totalPrice || 0), 0);

  const stats = [
    { icon: Ticket, label: 'Total Bookings', value: bookings.length, color: 'var(--violet)', glow: 'rgba(124,92,252,0.15)' },
    { icon: Calendar, label: 'Active Events', value: confirmedCount, color: '#34d399', glow: 'rgba(52,211,153,0.15)' },
    { icon: TrendingUp, label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, color: 'var(--amber)', glow: 'rgba(245,166,35,0.15)' },
    { icon: Heart, label: 'Saved Events', value: 0, color: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '40px 0',
        background: 'linear-gradient(135deg, rgba(124,92,252,0.1) 0%, rgba(10,10,15,0) 60%)',
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <img
              src={user?.avatar}
              alt={user?.name}
              style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(124,92,252,0.5)', objectFit: 'cover', boxShadow: '0 0 20px var(--violet-glow)' }}
            />
            <div>
              <p className="section-label" style={{ marginBottom: 4 }}>Dashboard</p>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 2 }}>
                Hello, {user?.name} 👋
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {stats.map(({ icon: Icon, label, value, color, glow }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: glow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
              </div>
              <p className="font-display" style={{ fontSize: 30, fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Bookings */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 2 }}>My Bookings</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{bookings.length} total bookings</p>
            </div>
            <Link to="/events" className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>
              Browse More <ArrowUpRight size={14} />
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <Ticket size={48} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text-muted)', opacity: 0.3 }} />
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>No bookings yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Start exploring events and make your first booking!</p>
              <Link to="/events" className="btn-primary" style={{ padding: '12px 24px' }}>
                Explore Events <ArrowUpRight size={15} />
              </Link>
            </div>
          ) : (
            <div style={{ padding: '12px 0' }}>
              {bookings.map((booking, i) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px',
                    borderBottom: i < bookings.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Thumbnail */}
                  {booking.eventImage && (
                    <img
                      src={booking.eventImage}
                      alt={booking.eventTitle}
                      style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                    />
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {booking.eventTitle}
                    </h3>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        📅 {new Date(booking.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        🎟 {booking.quantity}× {booking.ticketType?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                        ${booking.totalPrice?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status + action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span className={`tag ${booking.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled'}`} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                    </span>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
