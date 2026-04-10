import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

function EventCard({ event, index = 0 }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const categoryColors = {
    Music: { bg: 'rgba(124,92,252,0.2)', color: '#9d82ff' },
    Technology: { bg: 'rgba(59,130,246,0.2)', color: '#93c5fd' },
    Food: { bg: 'rgba(245,158,11,0.2)', color: '#fcd34d' },
    Sports: { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7' },
    Arts: { bg: 'rgba(236,72,153,0.2)', color: '#f9a8d4' },
    Business: { bg: 'rgba(14,165,233,0.2)', color: '#7dd3fc' },
  };
  const catStyle = categoryColors[event.category] || { bg: 'rgba(255,255,255,0.1)', color: '#fff' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="event-card"
      style={{ position: 'relative' }}
    >
      {/* Image */}
      <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
        <img
          src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600'}
          alt={event.title}
          className="event-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,15,0.6) 0%, transparent 60%)',
        }} />

        {/* Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
            background: catStyle.bg, color: catStyle.color,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${catStyle.color}30`,
          }}>
            {event.category}
          </span>
          {event.featured && (
            <span className="tag tag-amber" style={{ fontSize: 11, padding: '3px 10px' }}>
              ✦ Featured
            </span>
          )}
        </div>

        {/* Price badge */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(8px)',
          borderRadius: 8, padding: '4px 10px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
            {event.price === 0 ? 'Free' : `$${event.price}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 22px' }}>
        <h3 className="font-display" style={{
          fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 12,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          lineHeight: 1.3,
        }}>
          {event.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <Calendar size={13} color="var(--violet-light)" />
            <span>{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <MapPin size={13} color="var(--violet-light)" />
            <span>{event.city}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <Users size={13} color="var(--violet-light)" />
            <span>{event.attendees ?? 0} attending</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

        <Link
          to={`/events/${event._id}`}
          className="btn-primary"
          style={{ width: '100%', fontSize: 14, padding: '10px 16px', justifyContent: 'center' }}
        >
          View Details <ArrowUpRight size={15} />
        </Link>
      </div>
    </motion.div>
  );
}

export default EventCard;
