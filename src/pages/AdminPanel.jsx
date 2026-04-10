import React, { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, BarChart2, Trash2, Eye } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CATEGORIES = ['Music', 'Technology', 'Food', 'Sports', 'Arts', 'Business'];

const catColors = {
  Music: 'var(--violet)', Technology: '#3b82f6', Food: '#f59e0b',
  Sports: '#10b981', Arts: '#ec4899', Business: '#0ea5e9',
};

function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    apiFetch('/events')
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  const totalRevenue = events.reduce((sum, e) => sum + (e.attendees || 0) * e.price, 0);
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendees || 0), 0);

  const stats = [
    { label: 'Total Events', value: events.length, icon: Calendar, color: 'var(--violet)', glow: 'rgba(124,92,252,0.15)' },
    { label: 'Total Attendees', value: totalAttendees.toLocaleString(), icon: Users, color: '#34d399', glow: 'rgba(52,211,153,0.15)' },
    { label: 'Est. Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'var(--amber)', glow: 'rgba(245,166,35,0.15)' },
    { label: 'Growth Rate', value: '+24%', icon: TrendingUp, color: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '40px 0', background: 'linear-gradient(135deg, rgba(124,92,252,0.1) 0%, transparent 60%)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="tag tag-amber" style={{ marginBottom: 12, display: 'inline-flex' }}>⚙ Admin Access</div>
            <h1 className="font-display" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: 6 }}>
              Admin Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage events, monitor analytics, and oversee platform activity.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '3px solid var(--surface-2)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
              {stats.map(({ label, value, icon: Icon, color, glow }, i) => (
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

            {/* Two-col layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

              {/* Events table */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BarChart2 size={18} color="var(--violet-light)" />
                  <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>All Events</h2>
                  <span className="tag tag-surface" style={{ marginLeft: 'auto', fontSize: 12 }}>{events.length} total</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--ink-3)' }}>
                        {['Event', 'Category', 'Price', 'Attendees', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event, i) => (
                        <motion.tr key={event._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img src={event.image} alt={event.title}
                                style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: 'white', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{event.city}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: catColors[event.category] + '20', color: catColors[event.category] || 'var(--text-secondary)' }}>
                              {event.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
                            ${event.price}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
                            {event.attendees ?? 0}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Link to={`/events/${event._id}`}
                                style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--violet)'; e.currentTarget.style.color = 'var(--violet-light)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                                <Eye size={13} />
                              </Link>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category breakdown */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingUp size={18} color="var(--violet-light)" />
                  <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>By Category</h2>
                </div>
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {CATEGORIES.map((cat) => {
                    const count = events.filter(e => e.category === cat).length;
                    const pct = events.length > 0 ? (count / events.length) * 100 : 0;
                    const color = catColors[cat] || 'var(--violet)';
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{cat}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{count}</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--ink-3)', borderRadius: 99, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            style={{ height: '100%', background: color, borderRadius: 99 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Platform note */}
                <div style={{ margin: '0 28px 28px', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>⚠ Moderation Notice</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Any authenticated user can create events. Consider enabling event approval workflows to prevent spam or fake listings.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default AdminPanel;
