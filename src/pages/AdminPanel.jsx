import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Calendar, Users, DollarSign, TrendingUp, Search, Plus,
  Edit, Trash2, Star, StarOff, Eye, Shield, BarChart3,
  RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, X,
  Activity, Zap, Award, ArrowUp, ArrowDown, Minus as MinusIcon,
  Package, Globe, Flame, Target, LayoutGrid, List,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart,
  Pie, Cell, Legend, LineChart, Line, RadialBarChart,
  RadialBar, ComposedChart,
} from 'recharts';
import { useEvents } from '../context/EventContext';
import { useBookings } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../hooks/useConfirm';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortDate, capacityPercent } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const TABS = ['overview', 'pending', 'events', 'bookings', 'users'];
const PALETTE = ['#6366f1','#a855f7','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316'];

// ── Animated number counter ────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 1.2 }) {
  const motionVal = useMotionValue(0);
  const spring    = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const display   = useTransform(spring, v =>
    `${prefix}${Number(v.toFixed(decimals)).toLocaleString()}${suffix}`
  );
  const [text, setText] = useState(`${prefix}0${suffix}`);

  useEffect(() => { motionVal.set(value); }, [value, motionVal]);
  useEffect(() => spring.on('change', v => setText(`${prefix}${Number(Number(v).toFixed(decimals)).toLocaleString()}${suffix}`)), [spring, prefix, suffix, decimals]);

  return <span>{text}</span>;
}

// ── Glowing KPI card ───────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, prefix = '', suffix = '', sub, trend, color, delay = 0, decimals = 0 }) {
  const colors = {
    indigo:  { bg: 'from-indigo-500  to-primary-600',  ring: 'ring-indigo-200  dark:ring-indigo-900',  text: 'text-indigo-600  dark:text-indigo-400'  },
    purple:  { bg: 'from-purple-500  to-accent-600',   ring: 'ring-purple-200  dark:ring-purple-900',  text: 'text-purple-600  dark:text-purple-400'  },
    emerald: { bg: 'from-emerald-400 to-green-600',    ring: 'ring-emerald-200 dark:ring-emerald-900', text: 'text-emerald-600 dark:text-emerald-400' },
    amber:   { bg: 'from-amber-400   to-orange-500',   ring: 'ring-amber-200   dark:ring-amber-900',   text: 'text-amber-600   dark:text-amber-400'   },
    sky:     { bg: 'from-sky-400     to-blue-600',     ring: 'ring-sky-200     dark:ring-sky-900',     text: 'text-sky-600     dark:text-sky-400'     },
    rose:    { bg: 'from-rose-400    to-red-600',      ring: 'ring-rose-200    dark:ring-rose-900',    text: 'text-rose-600    dark:text-rose-400'    },
  };
  const c = colors[color] || colors.indigo;
  const trendIcon = trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : <MinusIcon className="w-3 h-3" />;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      {/* Decorative glow blob */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 bg-gradient-to-br ${c.bg} opacity-10 rounded-full blur-2xl`} />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{label}</p>
          <p className={`text-3xl font-extrabold text-gray-900 dark:text-white font-display`}>
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals ?? 0} />
          </p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trendColor}`}>
              {trendIcon}
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center ring-4 ${c.ring} shadow-md flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Custom recharts tooltip ────────────────────────────────────────────────
const AdminTooltip = ({ active, payload, label, currency = false }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2 text-xs">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-gray-500 dark:text-gray-400 capitalize">{p.name}:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {currency && p.dataKey === 'revenue' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Rejection modal ────────────────────────────────────────────────────────
function RejectModal({ event, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-gray-900 dark:text-white text-lg">Reject Event</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">"{event.title}"</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="mb-5">
          <label className="form-label">Reason for rejection (shown to creator)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="e.g. Please add more details about the venue…"
            className="input-field resize-none text-sm" autoFocus />
          <p className="text-xs text-gray-400 mt-1.5">Optional but recommended.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onConfirm(reason)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={onCancel} className="btn-outline px-5 py-2.5 text-sm">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Pending card ───────────────────────────────────────────────────────────
function PendingCard({ event, onApprove, onReject, onView }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border-l-4 border-amber-400 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
      <div className="flex gap-4 flex-wrap sm:flex-nowrap">
        <img src={event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop'} alt={event.title}
          className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white flex-1 truncate">{event.title}</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" /> Pending
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>📅 {formatShortDate(event.date)}</span>
            <span>📍 {event.city}</span>
            <span>💵 {formatCurrency(event.price)}</span>
            <span>👤 {event.profiles?.name || 'Unknown'}</span>
            <span>🕐 {event.submitted_at ? formatShortDate(event.submitted_at) : '—'}</span>
          </div>
          {event.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{event.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <button onClick={() => onView(event.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <Link to={`/create-event/${event.id}`} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
          <Edit className="w-3.5 h-3.5" /> Edit
        </Link>
        <div className="flex-1" />
        <button onClick={() => onReject(event)} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors font-semibold">
          <XCircle className="w-3.5 h-3.5" /> Reject
        </button>
        <button onClick={() => onApprove(event)} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors shadow-sm">
          <CheckCircle className="w-3.5 h-3.5" /> Approve
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, isAdmin }                                  = useAuth();
  const { events, deleteEvent, toggleFeatured, fetchEvents,
          approveEvent, rejectEvent, fetchPendingEvents }  = useEvents();
  const { fetchAllBookings }                               = useBookings();
  const { confirm }                                        = useConfirm();
  const navigate                                           = useNavigate();

  const [tab,          setTab]         = useState('overview');
  const [search,       setSearch]      = useState('');
  const [allBookings,  setAB]          = useState([]);
  const [users,        setUsers]       = useState([]);
  const [pendingEvts,  setPending]     = useState([]);
  const [refreshing,   setRef]         = useState(false);
  const [rejectTarget, setRejectTarget]= useState(null);
  const [eventView,    setEventView]   = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadAll();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (p) => {
        if (p.new?.status === 'pending') {
          supabase.from('events').select('*, profiles!created_by(name, avatar_url, email)')
            .eq('id', p.new.id).single()
            .then(({ data }) => { if (data) setPending(prev => [data, ...prev]); });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (p) => {
        const u = p.new;
        if (u.status === 'pending') {
          supabase.from('events').select('*, profiles!created_by(name, avatar_url, email)')
            .eq('id', u.id).single()
            .then(({ data }) => {
              if (!data) return;
              setPending(prev => {
                const ex = prev.find(e => e.id === data.id);
                return ex ? prev.map(e => e.id === data.id ? data : e) : [data, ...prev];
              });
            });
        } else {
          setPending(prev => prev.filter(e => e.id !== u.id));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, (p) => {
        setPending(prev => prev.filter(e => e.id !== p.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchAllBookings().then(setAB);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isAdmin]);

  const loadAll = async () => {
    fetchAllBookings().then(setAB);
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setUsers(data || []));
    fetchPendingEvents().then(setPending).catch(() => {});
  };

  const refresh = async () => {
    setRef(true);
    await fetchEvents();
    await loadAll();
    setRef(false);
    toast.success('Data refreshed!');
  };

  // ── Analytics computations ────────────────────────────────────────────────
  const confirmed  = allBookings.filter(b => b.status === 'confirmed');
  const cancelled  = allBookings.filter(b => b.status === 'cancelled');
  const totalRev   = confirmed.reduce((s, b) => s + Number(b.total_price), 0);
  const vipRev     = confirmed.filter(b => b.ticket_type === 'vip').reduce((s, b) => s + Number(b.total_price), 0);
  const avgTicket  = confirmed.length ? totalRev / confirmed.reduce((s, b) => s + (b.quantity || 1), 0) : 0;
  const totalAtt   = events.reduce((s, e) => s + (e.attendees || 0), 0);
  const publishedN = events.filter(e => e.status === 'published').length;

  // Revenue over last 30 days
  const revenueTrend = useMemo(() => {
    const days = 30;
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      map[k] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0, bookings: 0 };
    }
    confirmed.forEach(b => {
      const k = b.created_at?.slice(0, 10);
      if (map[k]) { map[k].revenue += Number(b.total_price); map[k].bookings++; }
    });
    return Object.values(map);
  }, [confirmed]);

  // Bookings this week vs last week
  const now  = new Date();
  const w0   = new Date(now); w0.setDate(w0.getDate() - 7);
  const w1   = new Date(now); w1.setDate(w1.getDate() - 14);
  const thisWeekBks  = confirmed.filter(b => new Date(b.created_at) > w0).length;
  const lastWeekBks  = confirmed.filter(b => new Date(b.created_at) > w1 && new Date(b.created_at) <= w0).length;
  const bkTrend = lastWeekBks ? Math.round(((thisWeekBks - lastWeekBks) / lastWeekBks) * 100) : 0;
  const thisWeekRev  = confirmed.filter(b => new Date(b.created_at) > w0).reduce((s, b) => s + Number(b.total_price), 0);
  const lastWeekRev  = confirmed.filter(b => new Date(b.created_at) > w1 && new Date(b.created_at) <= w0).reduce((s, b) => s + Number(b.total_price), 0);
  const revTrend = lastWeekRev ? Math.round(((thisWeekRev - lastWeekRev) / lastWeekRev) * 100) : 0;

  // Category breakdown
  const categoryData = useMemo(() => {
    const cats = [...new Set(events.map(e => e.category))];
    return cats.map(cat => {
      const catEvts  = events.filter(e => e.category === cat);
      const catBks   = confirmed.filter(b => catEvts.find(e => e.id === b.event_id));
      const rev      = catBks.reduce((s, b) => s + Number(b.total_price), 0);
      const avgFill  = catEvts.length ? Math.round(catEvts.reduce((s, e) => s + capacityPercent(e.attendees || 0, e.capacity || 1), 0) / catEvts.length) : 0;
      return { name: cat, events: catEvts.length, bookings: catBks.length, revenue: Math.round(rev), fill: avgFill };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [events, confirmed]);

  // Booking status donut
  const statusData = [
    { name: 'Confirmed', value: confirmed.length, color: '#10b981' },
    { name: 'Cancelled', value: cancelled.length, color: '#ef4444' },
  ];

  // Ticket type split
  const ticketTypeData = [
    { name: 'Standard', value: confirmed.filter(b => b.ticket_type === 'standard').length, color: '#6366f1' },
    { name: 'VIP',      value: confirmed.filter(b => b.ticket_type === 'vip').length,      color: '#f59e0b' },
  ];

  // Fill rate buckets
  const fillBuckets = useMemo(() => {
    const b = { '0–25%': 0, '26–50%': 0, '51–75%': 0, '76–100%': 0 };
    events.forEach(e => {
      const p = capacityPercent(e.attendees || 0, e.capacity || 1);
      if (p <= 25)      b['0–25%']++;
      else if (p <= 50) b['26–50%']++;
      else if (p <= 75) b['51–75%']++;
      else              b['76–100%']++;
    });
    return Object.entries(b).map(([name, value], i) => ({ name, value, fill: PALETTE[i] }));
  }, [events]);

  // Top events by revenue
  const topEvents = useMemo(() => events
    .map(e => {
      const bks = confirmed.filter(b => b.event_id === e.id);
      const rev = bks.reduce((s, b) => s + Number(b.total_price), 0);
      return { ...e, bksCount: bks.length, revenue: rev };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5), [events, confirmed]);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const bkFeed = confirmed.slice(0, 8).map(b => ({
      type: 'booking', time: b.created_at,
      text: `${b.profiles?.name || 'Someone'} booked ${b.quantity} × ${b.ticket_type} for "${b.events?.title || 'an event'}"`,
      meta: formatCurrency(Number(b.total_price)), icon: Zap, color: 'text-primary-500 bg-primary-50 dark:bg-primary-900/30',
    }));
    return bkFeed.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
  }, [confirmed]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApprove = async (event) => {
    try { await approveEvent(event.id); setPending(prev => prev.filter(e => e.id !== event.id)); toast.success(`✅ "${event.title}" approved!`); }
    catch { toast.error('Could not approve event.'); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    try { await rejectEvent(rejectTarget.id, reason); setPending(prev => prev.filter(e => e.id !== rejectTarget.id)); toast.success('Event rejected and creator notified.'); }
    catch { toast.error('Could not reject event.'); }
    setRejectTarget(null);
  };

  const handleDelete = async (event) => {
    const ok = await confirm({ title: 'Delete Event?', text: `Permanently delete "${event.title}"?`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    try { await deleteEvent(event.id); toast.success('Event deleted.'); } catch { toast.error('Could not delete event.'); }
  };

  const handleToggleFeatured = async (id) => {
    try { await toggleFeatured(id); toast.success('Featured status updated.'); } catch { toast.error('Update failed.'); }
  };

  const handleRoleChange = async (userId, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) { toast.error(error.message); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    toast.success('Role updated.');
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.city?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status) => ({
    published: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    pending:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    rejected:  'bg-red-100   dark:bg-red-900/40   text-red-700   dark:text-red-300',
    draft:     'bg-gray-100  dark:bg-gray-800      text-gray-600  dark:text-gray-400',
  }[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold text-gray-900 dark:text-white leading-none">Admin Panel</h1>
              <p className="text-gray-400 text-xs mt-0.5">Platform management & analytics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={refreshing}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link to="/create-event" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
              <Plus className="w-4 h-4" /> New Event
            </Link>
          </div>
        </div>

        {/* Tab strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative px-5 py-3 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {t === 'pending' ? 'Approvals' : t}
              {t === 'pending' && pendingEvts.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {pendingEvts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-8">

            {/* Pending alert */}
            {pendingEvts.length > 0 && (
              <motion.button initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setTab('pending')}
                className="w-full flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-3.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                    {pendingEvts.length} event{pendingEvts.length > 1 ? 's' : ''} awaiting approval
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">Click to review submissions</p>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Review →</span>
              </motion.button>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="col-span-2 lg:col-span-1 xl:col-span-1">
                <KpiCard icon={DollarSign} label="Total Revenue"   value={totalRev}       prefix="$" decimals={0} sub={`${formatCurrency(avgTicket)} avg ticket`} trend={revTrend} color="emerald" delay={0} />
              </div>
              <div className="col-span-2 lg:col-span-1 xl:col-span-1">
                <KpiCard icon={Zap}        label="Total Bookings"  value={confirmed.length} sub={`${cancelled.length} cancelled`} trend={bkTrend} color="indigo" delay={0.06} />
              </div>
              <div className="col-span-2 lg:col-span-1 xl:col-span-1">
                <KpiCard icon={Calendar}   label="Live Events"     value={publishedN}       sub={`${pendingEvts.length} pending`} color="purple" delay={0.12} />
              </div>
              <div className="col-span-2 lg:col-span-1 xl:col-span-1">
                <KpiCard icon={Users}      label="Total Attendees" value={totalAtt}          sub={`${users.length} registered users`} color="sky" delay={0.18} />
              </div>
              <div className="col-span-2 lg:col-span-1 xl:col-span-1">
                <KpiCard icon={Award}      label="VIP Revenue"     value={vipRev}       prefix="$" decimals={0} sub="VIP ticket sales" color="amber" delay={0.24} />
              </div>
              <div className="col-span-2 lg:col-span-1 xl:col-span-1">
                <KpiCard icon={Target}     label="Cancel Rate"     value={allBookings.length ? Math.round((cancelled.length / allBookings.length) * 100) : 0} suffix="%" sub={`${allBookings.length} total orders`} color="rose" delay={0.3} />
              </div>
            </div>

            {/* Revenue trend + Booking velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Daily revenue over the last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(totalRev)}</p>
                    <p className={`text-xs font-semibold flex items-center justify-end gap-1 mt-0.5 ${revTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {revTrend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(revTrend)}% this week
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueTrend} margin={{ top: 2, right: 0, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800 opacity-60" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500"
                      tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`} />
                    <Tooltip content={<AdminTooltip currency />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Booking velocity (bar) */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Booking Velocity</h3>
                <p className="text-xs text-gray-400 mb-5">Daily bookings, last 14 days</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueTrend.slice(-14)} margin={{ top: 2, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800 opacity-60" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" allowDecimals={false} />
                    <Tooltip content={<AdminTooltip />} />
                    <Bar dataKey="bookings" name="Bookings" radius={[4, 4, 0, 0]}>
                      {revenueTrend.slice(-14).map((_, i) => (
                        <Cell key={`velocity-${i}`} fill={`rgba(99,102,241,${0.4 + (i / 14) * 0.6})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown + Donut charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Horizontal bar — revenue by category */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Revenue by Category</h3>
                <p className="text-xs text-gray-400 mb-5">Total confirmed booking revenue per event category</p>
                <div className="space-y-3">
                  {categoryData.slice(0, 7).map((cat, i) => {
                    const maxRev = categoryData[0]?.revenue || 1;
                    const pct    = Math.round((cat.revenue / maxRev) * 100);
                    return (
                      <motion.div key={`cat-bar-${i}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                            <span className="text-xs text-gray-400">{cat.events} events</span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(cat.revenue)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: PALETTE[i % PALETTE.length] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Status donuts */}
              <div className="flex flex-col gap-4">
                {/* Booking status */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Booking Status</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={26} outerRadius={38} dataKey="value" paddingAngle={3}>
                            {statusData.map((d, i) => <Cell key={`status-cell-${i}`} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {statusData.map(d => (
                        <div key={`status-legend-${d.name}`} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-gray-500 dark:text-gray-400">{d.name}</span>
                          <span className="font-bold text-gray-900 dark:text-white ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ticket type */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Ticket Types</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={ticketTypeData} cx="50%" cy="50%" innerRadius={26} outerRadius={38} dataKey="value" paddingAngle={3}>
                            {ticketTypeData.map((d, i) => <Cell key={`ticket-cell-${i}`} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {ticketTypeData.map(d => (
                        <div key={`ticket-legend-${d.name}`} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-gray-500 dark:text-gray-400">{d.name}</span>
                          <span className="font-bold text-gray-900 dark:text-white ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fill rate distribution + Top events + Activity feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fill rate bar chart */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Fill Rate Distribution</h3>
                <p className="text-xs text-gray-400 mb-4">Events grouped by capacity fill %</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={fillBuckets} margin={{ top: 2, right: 0, bottom: 0, left: -24 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" />
                    <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-gray-500" allowDecimals={false} />
                    <Tooltip content={<AdminTooltip />} />
                    <Bar dataKey="value" name="Events" radius={[6, 6, 0, 0]}>
                      {fillBuckets.map((d, i) => <Cell key={`fill-cell-${i}`} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex justify-between text-xs text-gray-400">
                  <span>Low fill</span><span>High fill</span>
                </div>
              </div>

              {/* Top events */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" /> Top Events by Revenue
                </h3>
                <div className="space-y-3">
                  {topEvents.map((e, i) => (
                    <motion.div key={`top-evt-${i}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-gray-300 dark:text-gray-700 w-5 text-center">#{i + 1}</span>
                      <img src={e.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=80&auto=format&fit=crop'} alt={e.title}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{e.title}</p>
                        <p className="text-[10px] text-gray-400">{e.bksCount} bookings · {e.city}</p>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex-shrink-0">{formatCurrency(e.revenue)}</span>
                    </motion.div>
                  ))}
                  {!topEvents.length && <p className="text-xs text-gray-400 text-center py-4">No bookings yet</p>}
                </div>
              </div>

              {/* Live activity feed */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" /> Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.length ? recentActivity.map((a, i) => (
                    <motion.div key={`activity-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${a.color}`}>
                        <a.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{a.text}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[10px] text-gray-400">{a.time ? (() => {
                            const d = new Date(a.time);
                            const isToday = d.toDateString() === new Date().toDateString();
                            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return isToday ? time : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
                          })() : ''}</p>
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{a.meta}</p>
                        </div>
                      </div>
                    </motion.div>
                  )) : <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>}
                </div>
              </div>
            </div>

            {/* Category multi-stat table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Category Performance Matrix</h3>
                <p className="text-xs text-gray-400 mt-0.5">Revenue, bookings, and avg fill rate per category</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left bg-gray-50 dark:bg-gray-800/50">
                      {['Category','Events','Bookings','Revenue','Avg Fill','Performance'].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {categoryData.map((cat, i) => (
                      <motion.tr key={`cat-row-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                            <span className="font-semibold text-gray-900 dark:text-white">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{cat.events}</td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{cat.bookings}</td>
                        <td className="px-5 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(cat.revenue)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`font-semibold ${cat.fill >= 70 ? 'text-red-500' : cat.fill >= 40 ? 'text-amber-500' : 'text-gray-600 dark:text-gray-400'}`}>
                            {cat.fill}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 w-36">
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (cat.revenue / (categoryData[0]?.revenue || 1)) * 100)}%` }}
                              transition={{ duration: 1, delay: i * 0.07 }}
                              className="h-full rounded-full"
                              style={{ background: PALETTE[i % PALETTE.length] }}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING ── */}
        {tab === 'pending' && (
          <div>
            {!pendingEvts.length ? (
              <EmptyState icon="✅" title="All caught up!" description="No events are waiting for approval right now." />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-white">{pendingEvts.length}</strong> event{pendingEvts.length > 1 ? 's' : ''} awaiting review
                </p>
                {pendingEvts.map(event => (
                  <PendingCard key={event.id} event={event}
                    onApprove={handleApprove}
                    onReject={e => setRejectTarget(e)}
                    onView={id => navigate(`/events/${id}`)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EVENTS ── */}
        {tab === 'events' && (
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events, cities, categories…" className="input-field pl-10 w-full" />
              </div>
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                  <button key={v} onClick={() => setEventView(v)}
                    className={`p-2.5 transition-colors ${eventView === v ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {!filteredEvents.length ? (
              <EmptyState icon="📅" title="No events found" description="Try a different search term." />
            ) : eventView === 'grid' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((event, i) => (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img src={event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop'} alt={event.title}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusBadge(event.status)}`}>{event.status}</span>
                        {event.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">⭐</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(event.date)} · {event.city}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex-1 mr-3">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>{event.attendees || 0}</span><span>{event.capacity || 0}</span>
                          </div>
                          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-400 rounded-full" style={{ width: `${capacityPercent(event.attendees||0,event.capacity||1)}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Link to={`/events/${event.id}`} className="p-1.5 text-gray-400 hover:text-primary-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Eye className="w-3.5 h-3.5" /></Link>
                          <Link to={`/create-event/${event.id}`} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Edit className="w-3.5 h-3.5" /></Link>
                          <button onClick={() => handleToggleFeatured(event.id)} className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{event.featured ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}</button>
                          <button onClick={() => handleDelete(event)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event, i) => (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4 shadow-sm">
                    <img src={event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop'} alt={event.title}
                      className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</p>
                        {event.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">Featured</span>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusBadge(event.status)}`}>{event.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatShortDate(event.date)} · {event.city} · {event.attendees||0}/{event.capacity||0}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to={`/events/${event.id}`} className="p-2 text-gray-400 hover:text-primary-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Eye className="w-4 h-4" /></Link>
                      <Link to={`/create-event/${event.id}`} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Edit className="w-4 h-4" /></Link>
                      <button onClick={() => handleToggleFeatured(event.id)} className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{event.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}</button>
                      <button onClick={() => handleDelete(event)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {tab === 'bookings' && (
          <div>
            {!allBookings.length ? <EmptyState icon="🎫" title="No bookings yet" description="Bookings will appear here." /> : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                      {['Ref','Event','User','Type','Qty','Total','Status','Date'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {allBookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{b.booking_ref}</td>
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[160px] truncate">{b.events?.title}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{b.profiles?.name || '—'}</td>
                        <td className="px-5 py-3 capitalize text-gray-600 dark:text-gray-400">{b.ticket_type}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{b.quantity}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(b.total_price))}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>{b.status}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{formatShortDate(b.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

  {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            {!users.length ? <EmptyState icon="👥" title="No users yet" description="Users who sign up will appear here." /> : (
              <div className="space-y-3">
                {users.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    // FIX: Changed to 'flex flex-col' for mobile to prevent overflow
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
                  >
                    <img 
                      src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff&size=80`} 
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0" 
                    />
                    
                    {/* FIX: flex-1 ensures text takes available space on desktop, but naturally wraps on mobile */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                    </div>
                    
                    {/* FIX: w-full sm:w-auto ensures the dropdown is clickable on mobile */}
                    <select 
                      value={u.role} 
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full sm:w-auto"
                    >
                      <option value="user">User</option>
                      <option value="organizer">Organizer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {rejectTarget && (
          <RejectModal event={rejectTarget} onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}