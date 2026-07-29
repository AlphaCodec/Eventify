import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Ticket, Star,
  ArrowRight, BarChart2, Zap, Award, Eye, Edit,
  ChevronDown, ChevronUp, Calendar, Clock,
  Target, Percent,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatShortDate, capacityPercent } from '../utils/helpers';

// ─── Tiny stat pill ────────────────────────────────────────────────────────
function StatPill({ label, value, color = 'gray' }) {
  const colors = {
    green:   'bg-green-50  dark:bg-green-900/20  text-green-700  dark:text-green-300',
    blue:    'bg-blue-50   dark:bg-blue-900/20   text-blue-700   dark:text-blue-300',
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
    amber:   'bg-amber-50  dark:bg-amber-900/20  text-amber-700  dark:text-amber-300',
    gray:    'bg-gray-100  dark:bg-gray-800       text-gray-700   dark:text-gray-300',
  };
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-sm font-extrabold mt-0.5">{value}</p>
    </div>
  );
}

// ─── Per-event insights card ───────────────────────────────────────────────
function EventInsightCard({ event, bookings }) {
  const [open, setOpen] = useState(false);

  const confirmed     = bookings.filter(b => b.status === 'confirmed');
  const cancelled     = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue  = confirmed.reduce((s, b) => s + Number(b.total_price), 0);
  const totalTickets  = confirmed.reduce((s, b) => s + (b.quantity || 1), 0);
  const vipBookings   = confirmed.filter(b => b.ticket_type === 'vip');
  const stdBookings   = confirmed.filter(b => b.ticket_type === 'standard');
  const vipRevenue    = vipBookings.reduce((s, b) => s + Number(b.total_price), 0);
  const pct           = capacityPercent(event.attendees || 0, event.capacity || 1);
  const spotsLeft     = Math.max(0, (event.capacity || 0) - (event.attendees || 0));
  const isPast        = new Date(event.date) < new Date();

  // Build daily booking timeline (last 14 days or since event creation)
  const timeline = useMemo(() => {
    const days = 14;
    const map  = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key, bookings: 0, revenue: 0 };
    }
    confirmed.forEach(b => {
      const key = b.created_at?.slice(0, 10);
      if (map[key]) { map[key].bookings++; map[key].revenue += Number(b.total_price); }
    });
    return Object.values(map);
  }, [confirmed]);

  const peakDay = timeline.reduce((best, d) => d.bookings > best.bookings ? d : best, timeline[0] || {});
  const avgDaily = confirmed.length / 14;

  const statusBadge = {
    published: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    pending:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    rejected:  'bg-red-100   dark:bg-red-900/40   text-red-700   dark:text-red-300',
    draft:     'bg-gray-100  dark:bg-gray-800      text-gray-600  dark:text-gray-400',
  }[event.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-primary-600 dark:text-primary-400 font-bold">
          {payload[0]?.value} booking{payload[0]?.value !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header — always visible */}
      <div
        className="p-5 cursor-pointer select-none flex gap-4 items-center"
        onClick={() => setOpen(v => !v)}
      >
        <img
          src={event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop'}
          alt={event.title}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{event.title}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusBadge}`}>
              {event.status}
            </span>
            {isPast && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                Ended
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(event.date)} · {event.city}</p>

          {/* Quick-glance stats row */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-500" />
              <strong className="text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-primary-500" />
              <strong className="text-gray-900 dark:text-white">{totalTickets}</strong> tickets sold
            </span>
            <span className="flex items-center gap-1">
              <Percent className="w-3 h-3 text-amber-500" />
              <strong className="text-gray-900 dark:text-white">{pct}%</strong> filled
            </span>
          </div>
        </div>

        {/* Capacity mini bar */}
        <div className="hidden sm:block w-24 flex-shrink-0">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{pct}%</span>
            <span>{spotsLeft} left</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded insights panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-5 space-y-6">

              {/* KPI grid */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Performance</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill label="Total Revenue"   value={formatCurrency(totalRevenue)} color="green" />
                  <StatPill label="Tickets Sold"    value={totalTickets}                 color="primary" />
                  <StatPill label="Confirmed"       value={confirmed.length}             color="blue" />
                  <StatPill label="Cancelled"       value={cancelled.length}             color={cancelled.length > 0 ? 'amber' : 'gray'} />
                </div>
              </div>

              {/* Ticket breakdown */}
              {(vipBookings.length > 0 || stdBookings.length > 0) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Ticket Breakdown</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Standard</p>
                      </div>
                      <p className="text-lg font-extrabold text-gray-900 dark:text-white">{stdBookings.length}</p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(stdBookings.reduce((s, b) => s + Number(b.total_price), 0))}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">⭐ VIP</p>
                      </div>
                      <p className="text-lg font-extrabold text-gray-900 dark:text-white">{vipBookings.length}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {formatCurrency(vipRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Capacity visualisation */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Capacity</p>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {event.attendees || 0} / {event.capacity || 0}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>0</span>
                  <span className={`font-semibold ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}`}>
                    {pct >= 90 ? '🔥 Almost full' : pct >= 70 ? '⚡ Filling fast' : `${spotsLeft} spots remaining`}
                  </span>
                  <span>{event.capacity || 0}</span>
                </div>
              </div>

              {/* Booking timeline sparkline */}
              {confirmed.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    Booking Activity · Last 14 days
                  </p>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={timeline} margin={{ top: 2, right: 0, bottom: 0, left: -32 }}>
                      <defs>
                        <linearGradient id={`grad-${event.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone" dataKey="bookings"
                        stroke="#6366f1" strokeWidth={2}
                        fill={`url(#grad-${event.id})`}
                        dot={false} activeDot={{ r: 4, fill: '#6366f1' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>14 days ago</span>
                    {peakDay.bookings > 0 && (
                      <span className="text-primary-500 font-semibold">
                        Peak: {peakDay.bookings} booking{peakDay.bookings !== 1 ? 's' : ''} on {peakDay.date}
                      </span>
                    )}
                    <span>Today</span>
                  </div>
                </div>
              )}

              {confirmed.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No confirmed bookings yet.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Share your event to start selling tickets!</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <Link to={`/events/${event.id}`}
                  className="flex-1 flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold">
                  <Eye className="w-3.5 h-3.5" /> View Event
                </Link>
                <Link to={`/create-event/${event.id}`}
                  className="flex-1 flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-semibold">
                  <Edit className="w-3.5 h-3.5" /> Edit Event
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Overview summary bar ─────────────────────────────────────────────────
function InsightsSummary({ myEvents, eventBookings }) {
  const publishedEvents = myEvents.filter(e => e.status === 'published');
  const allBookings     = Object.values(eventBookings).flat();
  const confirmed       = allBookings.filter(b => b.status === 'confirmed');
  const totalRevenue    = confirmed.reduce((s, b) => s + Number(b.total_price), 0);
  const totalTickets    = confirmed.reduce((s, b) => s + (b.quantity || 1), 0);
  const totalAttendees  = publishedEvents.reduce((s, e) => s + (e.attendees || 0), 0);
  const totalCapacity   = publishedEvents.reduce((s, e) => s + (e.capacity || 0), 0);
  const overallFill     = totalCapacity > 0 ? Math.round((totalAttendees / totalCapacity) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { icon: DollarSign, label: 'Total Revenue',   value: formatCurrency(totalRevenue),   color: 'text-green-500',   bg: 'bg-green-50 dark:bg-green-900/20'   },
        { icon: Ticket,     label: 'Tickets Sold',    value: totalTickets,                   color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
        { icon: Users,      label: 'Total Attendees', value: totalAttendees,                 color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20'     },
        { icon: Target,     label: 'Avg Fill Rate',   value: `${overallFill}%`,              color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
      ].map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className={`card p-4 flex flex-col items-center text-center ${bg}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────
export default function HostInsights({ myEvents, userId }) {
  const [eventBookings, setEventBookings] = useState({});
  const [loadingBks,    setLoadingBks]    = useState(true);

  const publishedEvents = myEvents.filter(e => e.status === 'published');

  useEffect(() => {
    if (!publishedEvents.length) { setLoadingBks(false); return; }
    const ids = publishedEvents.map(e => e.id);

    supabase
      .from('bookings')
      .select('*, profiles!user_id(name, email)')
      .in('event_id', ids)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        const grouped = {};
        ids.forEach(id => { grouped[id] = []; });
        data.forEach(b => {
          if (grouped[b.event_id]) grouped[b.event_id].push(b);
        });
        setEventBookings(grouped);
        setLoadingBks(false);
      });
  }, [publishedEvents.length, userId]);

  if (!publishedEvents.length) return null;

  return (
    <div className="space-y-6">
      <InsightsSummary myEvents={myEvents} eventBookings={eventBookings} />

      <div className="space-y-3">
        {myEvents.map(event => (
          <EventInsightCard
            key={event.id}
            event={event}
            bookings={eventBookings[event.id] || []}
          />
        ))}
      </div>
    </div>
  );
}
