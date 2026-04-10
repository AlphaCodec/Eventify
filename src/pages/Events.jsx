import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api';
import EventCard from '../components/EventCard';
import { motion } from 'framer-motion';

const categories = ['All Events', 'Music', 'Technology', 'Food', 'Sports', 'Arts', 'Business'];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Events');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    apiFetch('/events')
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All Events' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'popular') return b.attendees - a.attendees;
      return 0;
    });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)' }}>

      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,92,252,0.12) 0%, rgba(10,10,15,0) 60%)',
        borderBottom: '1px solid var(--border)',
        padding: '56px 0 48px',
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Explore</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'white', marginBottom: 8 }}>
              Discover Events
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Find your next unforgettable experience</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {/* Search + filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '24px',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 20 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search events, cities, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 42 }}
              />
            </div>

            {/* Sort */}
            <div style={{ position: 'relative', minWidth: 180 }}>
              <SlidersHorizontal size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 36, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="date">Sort: Date</option>
                <option value="price">Sort: Price</option>
                <option value="popular">Sort: Popular</option>
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        {!loading && (
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Showing <span style={{ color: 'white', fontWeight: 600 }}>{filteredEvents.length}</span> events
              {selectedCategory !== 'All Events' && <span> in <span style={{ color: 'var(--violet-light)' }}>{selectedCategory}</span></span>}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 200 }} />
                <div style={{ padding: 22 }}>
                  <div className="skeleton" style={{ height: 20, marginBottom: 12, width: '70%' }} />
                  <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events grid */}
        {!loading && filteredEvents.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {filteredEvents.map((event, i) => (
              <EventCard key={event._id} event={event} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Sparkles size={48} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text-muted)', opacity: 0.4 }} />
            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8 }}>No events found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All Events'); }}
              className="btn-outline"
              style={{ marginTop: 24 }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;
