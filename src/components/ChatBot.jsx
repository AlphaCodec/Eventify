import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles, Minimize2,
  RefreshCw, ChevronRight, MapPin, Calendar, Users,
  Star, Ticket, ExternalLink, ArrowRight,
} from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useWishlist } from '../context/WishlistContext';
import { useEvents }   from '../context/EventContext';
import {
  detectIntent, buildResponse, MSG,
} from '../lib/chatEngine';
import {
  formatCurrency, formatShortDate, formatTime, spotsLeft, capacityPercent,
} from '../utils/helpers';

// ─── Typing delay simulator ────────────────────────────────────────────────
const typingDelay = (parts) => Math.min(400 + parts * 120, 1400);

// ─── Tiny markdown renderer ────────────────────────────────────────────────
function Md({ text, dark = false }) {
  const lines = String(text).split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const isBullet = /^[•\-]\s/.test(line);
        const parts = line.replace(/^[•\-]\s/, '').split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**')
            ? <strong key={j} className="font-semibold">{p.slice(2,-2)}</strong>
            : p
        );
        if (isBullet) return (
          <div key={i} className="flex items-start gap-2">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dark ? 'bg-white/60' : 'bg-primary-400'}`} />
            <span>{parts}</span>
          </div>
        );
        return <div key={i}>{parts}</div>;
      })}
    </div>
  );
}

// ─── EventMiniCard ─────────────────────────────────────────────────────────
function EventMiniCard({ event, showVip }) {
  const spots  = spotsLeft(event.attendees||0, event.capacity||1);
  const pct    = capacityPercent(event.attendees||0, event.capacity||1);
  const isFull = spots === 0;
  return (
    <Link to={`/events/${event.id}`}
      className="flex gap-2.5 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
    >
      <img
        src={event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop'}
        alt={event.title}
        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs text-gray-900 dark:text-white leading-tight line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {event.title}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5" />
          {formatShortDate(event.date)} · {event.city}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <div>
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{formatCurrency(event.price)}</span>
            {showVip && event.price_vip > event.price && (
              <span className="text-[10px] text-amber-500 ml-1.5 font-semibold">VIP {formatCurrency(event.price_vip)}</span>
            )}
          </div>
          {isFull
            ? <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">FULL</span>
            : <span className="text-[10px] text-gray-400">{spots} left</span>
          }
        </div>
        <div className="mt-1 h-0.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${pct>=90?'bg-red-400':pct>=70?'bg-yellow-400':'bg-green-400'}`} style={{width:`${pct}%`}} />
        </div>
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 self-center flex-shrink-0 group-hover:text-primary-400 transition-colors" />
    </Link>
  );
}

// ─── BookingMiniCard ───────────────────────────────────────────────────────
function BookingMiniCard({ booking }) {
  const ev     = booking.events || {};
  const isUp   = ev.date && new Date(ev.date) >= new Date();
  return (
    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-xs text-gray-900 dark:text-white leading-tight line-clamp-1 flex-1">{ev.title || 'Event'}</p>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
          isUp ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
               : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
        }`}>{isUp ? 'Upcoming' : 'Past'}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
        {[
          { label: 'Date',   value: ev.date ? formatShortDate(ev.date) : '—' },
          { label: 'Ref',    value: booking.booking_ref },
          { label: 'Ticket', value: `${booking.quantity}× ${booking.ticket_type}` },
          { label: 'Total',  value: formatCurrency(Number(booking.total_price)) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StatGrid ──────────────────────────────────────────────────────────────
function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(({ label, value, icon }) => (
        <div key={label} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 text-center">
          <p className="text-base">{icon}</p>
          <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">{value}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── ActionList ────────────────────────────────────────────────────────────
function ActionList({ items, onIntent }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => {
        if (item.link) return (
          <Link key={i} to={item.link}
            className={`flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
              item.primary
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400'
            }`}
          >
            <span>{item.label}</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        );
        return (
          <button key={i} onClick={() => onIntent(item.intent)}
            className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-xl font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 transition-all"
          >
            <span>{item.label}</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>
        );
      })}
    </div>
  );
}

// ─── QuickChips ────────────────────────────────────────────────────────────
function QuickChips({ chips, onSend }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip, i) => (
        <button key={i} onClick={() => onSend(chip.intent || chip.label)}
          className="text-[11px] px-2.5 py-1.5 rounded-full font-semibold bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// ─── Render a single message part ─────────────────────────────────────────
function MessagePart({ part, onIntent, onSend }) {
  switch (part.type) {
    case MSG.TEXT:
      return <Md text={part.content} />;
    case MSG.EVENT_LIST:
      return (
        <div className="space-y-2 mt-1">
          {part.events.map(e => <EventMiniCard key={e.id} event={e} showVip={part.showVip} />)}
        </div>
      );
    case MSG.BOOKING_LIST:
      return (
        <div className="space-y-2 mt-1">
          {part.bookings.map(b => <BookingMiniCard key={b.id} booking={b} />)}
        </div>
      );
    case MSG.STAT:
      return <div className="mt-1"><StatGrid stats={part.stats} /></div>;
    case MSG.ACTION_LIST:
      return <div className="mt-1.5"><ActionList items={part.items} onIntent={onIntent} /></div>;
    case MSG.QUICK_CHIPS:
      return <div className="mt-2"><QuickChips chips={part.chips} onSend={onSend} /></div>;
    default:
      return null;
  }
}

// ─── Message bubble ────────────────────────────────────────────────────────
function Bubble({ msg, user, onIntent, onSend }) {
  const isUser = msg.role === 'user';
  const avatar = user?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=6366f1&color=fff&size=80`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 self-end mb-0.5">
        {isUser
          ? <img src={avatar} alt="You" className="w-6 h-6 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900" />
          : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
        }
      </div>

      {/* Content */}
      <div className={`max-w-[88%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {msg.loading ? (
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800">
            <span className="flex items-center gap-1.5">
              {[0,150,300].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
          </div>
        ) : (
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
          }`}>
            {msg.parts ? (
              <div className="space-y-2">
                {msg.parts.map((part, i) => (
                  <MessagePart key={i} part={part} onIntent={onIntent} onSend={onSend} />
                ))}
              </div>
            ) : (
              <Md text={msg.content} dark={isUser} />
            )}
          </div>
        )}
        <p className="text-[10px] text-gray-300 dark:text-gray-600 px-1">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Initial chips by auth state ───────────────────────────────────────────
const initChips = (user) => user ? [
  { label: '🎫 My bookings',    text: 'show my bookings'     },
  { label: '❤️ My wishlist',    text: 'show my wishlist'     },
  { label: '💡 Recommend',      text: 'recommend events'     },
  { label: '💰 My spending',    text: 'how much have I spent'},
  { label: '📅 Browse events',  text: 'find events'          },
  { label: '❌ Cancel booking', text: 'how do I cancel'      },
] : [
  { label: '📅 Events',         text: 'show all events'      },
  { label: '⭐ Featured',       text: 'featured events'      },
  { label: '📖 How to book',    text: 'how to book a ticket' },
  { label: '💵 Prices',         text: 'ticket prices'        },
  { label: '⭐ VIP',            text: 'VIP ticket info'      },
  { label: '🎟️ E-tickets',      text: 'about QR e-tickets'  },
];

// ─── Main ChatBot ──────────────────────────────────────────────────────────
export default function ChatBot() {
  const { user }         = useAuth();
  const { bookings }     = useBookings();
  const { wishlistIds }  = useWishlist();
  const { events }       = useEvents();

  const [open,    setOpen]   = useState(false);
  const [min,     setMin]    = useState(false);
  const [msgs,    setMsgs]   = useState([]);
  const [input,   setInput]  = useState('');
  const [typing,  setTyping] = useState(false);
  const [unread,  setUnread] = useState(0);
  let greeted=false;
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && !min) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing, open, min]);

  // ── Focus on open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && !min) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open, min]);

  // ── Deliver bot response ──────────────────────────────────────────────────
  const deliver = useCallback((parts, delay = 800) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const msg = { role: 'bot', parts, ts: Date.now(), id: Math.random() };
      setMsgs(prev => [...prev, msg]);
      if (min) setUnread(c => c + 1);
    }, delay);
  }, [min]);

  // ── Process text intent ───────────────────────────────────────────────────
  const process = useCallback((text) => {
    const intent = detectIntent(text);
    const parts  = buildResponse(intent, { user, bookings, wishlistIds, events }, text, {});
    deliver(parts, typingDelay(parts.length));
  }, [user, bookings, wishlistIds, events, deliver]);

  // ── Send a user message ───────────────────────────────────────────────────
  const send = useCallback((text) => {
    if (!text?.trim()) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', content: text, ts: Date.now(), id: Math.random() }]);
    process(text);
  }, [process]);

  // ── Open + greet ──────────────────────────────────────────────────────────
  const handleOpen = () => {
    setOpen(true);
    setMin(false);
    setUnread(0);
    if (!greeted) {
      greeted=true;
      const name   = user ? ` ${user.name.split(' ')[0]}` : '';
      const hour   = new Date().getHours();
      const tod    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const greet  = `${tod}${name}! 👋 I'm **Evie**, your Eventify assistant.\n\nI can check your bookings, find events, give recommendations, and more — all without leaving this chat!`;
      setTimeout(() => {
        setMsgs([
          { role: 'bot', parts: [
              { type: MSG.TEXT, content: greet },
              { type: MSG.QUICK_CHIPS, chips: initChips(user) },
            ], ts: Date.now(), id: 'greet',
          },
        ]);
      }, 300);
    }
  };

  const handleReset = () => {
    setMsgs([]); greeted=false; setUnread(0); setTyping(false);
    setTimeout(handleOpen, 60);
  };

  return (
    <>
      {/* ── FAB ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full shadow-glow flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            <span className="absolute inset-0 rounded-full border-2 border-primary-400/60 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="window"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                  <Sparkles className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-primary-600 rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm leading-none">Evie</p>
                <p className="text-primary-200 text-[11px] mt-0.5">Eventify Assistant · Always online</p>
              </div>
              <div className="flex gap-1">
                <button onClick={handleReset} title="New chat"
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setMin(v => !v); setUnread(0); }}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!min && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 px-4 py-4 space-y-4"
                  style={{ minHeight: 260, maxHeight: 380 }}>
                  {msgs.map(msg => (
                    <Bubble key={msg.id} msg={msg} user={user} onIntent={send} onSend={send} />
                  ))}
                  {typing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 self-end">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800">
                        <span className="flex gap-1.5">
                          {[0,150,300].map(d => (
                            <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                              style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <form onSubmit={e => { e.preventDefault(); send(input); }}
                  className="flex items-center gap-2 px-3 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything…"
                    disabled={typing}
                    maxLength={400}
                    className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all disabled:opacity-60"
                  />
                  <button type="submit" disabled={!input.trim() || typing}
                    className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center disabled:opacity-40 transition-all hover:shadow-glow active:scale-95">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Footer */}
                <div className="text-center py-1.5 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800">
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 font-medium tracking-wide">
                    Powered by Eventify AI · No data sent externally
                  </p>
                </div>
              </>
            )}

            {/* Minimised unread banner */}
            {min && unread > 0 && (
              <button onClick={() => { setMin(false); setUnread(0); }}
                className="bg-white dark:bg-gray-900 px-4 py-2.5 text-sm flex items-center justify-between border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full">
                <span className="text-gray-600 dark:text-gray-400">{unread} new message{unread > 1 ? 's' : ''}</span>
                <span className="text-primary-500 text-xs font-bold">Show</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
