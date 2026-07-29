import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Star, ArrowRight } from 'lucide-react';
import { formatShortDate, formatTime, formatCurrency, capacityPercent } from '../utils/helpers';

const FALLBACK = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop';
const AUTO_INTERVAL = 5000; // ms between auto-transitions

// Slide transition variants
const variants = {
  enter: (dir) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1.04,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] },
  },
  exit: (dir) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] },
  }),
};

export default function HeroCarousel({ events = [] }) {
  const [index, setIndex]     = useState(0);
  const [direction, setDir]   = useState(1);   // 1 = forward, -1 = backward
  const [paused, setPaused]   = useState(false);
  const timerRef              = useRef(null);

  // Show skeleton when no events yet
  const hasEvents = events.length > 0;
  const event     = hasEvents ? events[index] : null;

  const goTo = useCallback((newIndex, dir) => {
    setDir(dir);
    setIndex(newIndex);
  }, []);

  const next = useCallback(() => {
    if (!hasEvents) return;
    goTo((index + 1) % events.length, 1);
  }, [index, events.length, hasEvents, goTo]);

  const prev = useCallback(() => {
    if (!hasEvents) return;
    goTo((index - 1 + events.length) % events.length, -1);
  }, [index, events.length, hasEvents, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused || !hasEvents || events.length < 2) return;
    timerRef.current = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused, hasEvents, events.length, next]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const pct = event ? capacityPercent(event.attendees || 0, event.capacity || 1) : 0;

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (!hasEvents) {
    return (
      <div className="relative rounded-3xl overflow-hidden h-[420px] bg-gray-800 animate-pulse shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="h-3 bg-white/20 rounded w-24" />
          <div className="h-6 bg-white/20 rounded w-3/4" />
          <div className="h-4 bg-white/20 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-2xl h-[420px] cursor-pointer select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Sliding images ── */}
      <AnimatePresence custom={direction} mode="sync">
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          {/* Image */}
          <img
            src={event.image_url || FALLBACK}
            alt={event.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── Event info overlay (also animated) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`info-${index}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0,  transition: { delay: 0.2, duration: 0.4 } }}
          exit={{ opacity: 0, y: -8,    transition: { duration: 0.25 } }}
          className="absolute bottom-0 left-0 right-0 p-6"
        >
          {/* Category + featured badge */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="text-xs font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-1 rounded-full">
              {event.category}
            </span>
            {event.featured && (
              <span className="text-xs font-bold bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-300" /> Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display text-xl font-extrabold text-white leading-snug line-clamp-2 mb-3">
            {event.title}
          </h3>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/80 mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-300" />
              {formatShortDate(event.date)} · {formatTime(event.time)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-300" />
              {event.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary-300" />
              {event.attendees?.toLocaleString()} / {event.capacity?.toLocaleString()}
            </span>
          </div>

          {/* Capacity bar + price + CTA */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>{pct}% filled</span>
                <span>{event.capacity - (event.attendees||0)} spots left</span>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-white/60 text-xs">From</p>
                <p className="text-white font-extrabold text-lg leading-none">{formatCurrency(event.price)}</p>
              </div>
              <Link
                to={`/events/${event.id}`}
                className="btn-primary text-sm px-4 py-2 shadow-glow flex items-center gap-1.5"
                onClick={e => e.stopPropagation()}
              >
                View <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Prev / Next arrows ── */}
      {events.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 z-10"
            aria-label="Previous event"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 z-10"
            aria-label="Next event"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {events.length > 1 && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              className={`transition-all rounded-full ${
                i === index
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to event ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Auto-play progress bar ── */}
      {!paused && events.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
          <motion.div
            key={`progress-${index}`}
            className="h-full bg-primary-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: AUTO_INTERVAL / 1000, ease: 'linear' }}
          />
        </div>
      )}

      {/* ── Slide counter badge ── */}
      {events.length > 1 && (
        <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {index + 1} / {events.length}
        </div>
      )}
    </div>
  );
}
