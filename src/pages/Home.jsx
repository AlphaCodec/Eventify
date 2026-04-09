import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Star, ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api';
import EventCard from '../components/EventCard';
import { motion } from 'framer-motion';

const MARQUEE_ITEMS = [
  '✦ Music Festivals', '✦ Tech Conferences', '✦ Food & Wine', '✦ Art Exhibitions',
  '✦ Sports Events', '✦ Business Summits', '✦ Cultural Shows', '✦ Workshops',
  '✦ Music Festivals', '✦ Tech Conferences', '✦ Food & Wine', '✦ Art Exhibitions',
  '✦ Sports Events', '✦ Business Summits', '✦ Cultural Shows', '✦ Workshops',
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Discovery',
    desc: 'Pinpoint the perfect event in seconds with intelligent filtering and smart recommendations.',
    color: 'var(--violet)',
    glow: 'rgba(124,92,252,0.2)',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    desc: 'Book with confidence. Every transaction is protected by Stripe\'s industry-leading encryption.',
    color: 'var(--amber)',
    glow: 'rgba(245,166,35,0.2)',
  },
  {
    icon: Star,
    title: 'Curated Quality',
    desc: 'Every event passes through our quality standards — only the best make it to you.',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.2)',
  },
];

const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '2.4K', label: 'Events Hosted' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '$2M+', label: 'Tickets Sold' },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealDiv({ children, delay = 0, style, className }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className || ''}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function Home() {
  const [featuredEvents, setFeaturedEvents] = useState([]);

  useEffect(() => {
    apiFetch('/events?featured=true')
      .then((data) => setFeaturedEvents(data.slice(0, 3)))
      .catch(console.error);
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section className="hero-gradient" style={{ padding: '80px 0 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: -120, right: -120, width: 600, height: 600,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80, width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="tag tag-violet" style={{ marginBottom: 24 }}>
                <Sparkles size={11} />
                Your event journey starts here
              </div>

              <h1 className="font-display" style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                color: 'white',
                marginBottom: 24,
              }}>
                Discover{' '}
                <span className="gradient-text">Extraordinary</span>
                {' '}Events Near You
              </h1>

              <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
                Join thousands of people discovering and attending incredible events — from concerts to conferences, find experiences that inspire and connect you.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/events" className="btn-primary" style={{ fontSize: 15, padding: '14px 28px' }}>
                  Explore Events <ArrowUpRight size={17} />
                </Link>
                <Link to="/create-event" className="btn-outline" style={{ fontSize: 15, padding: '14px 28px' }}>
                  Create Event
                </Link>
              </div>

              {/* Scroll hint */}
              <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <ChevronDown size={16} style={{ animation: 'float 2s ease-in-out infinite' }} />
                Scroll to explore
              </div>
            </motion.div>

            {/* Right column — image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ position: 'relative' }}
            >
              <div style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
                <img
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800"
                  alt="Events"
                  style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(10,10,15,0.5) 100%)' }} />
              </div>

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  position: 'absolute', bottom: -20, left: -24,
                  background: 'rgba(30,30,46,0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', gap: 20 }}>
                  {STATS.slice(0, 2).map(({ value, label }) => (
                    <div key={label}>
                      <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{value}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  position: 'absolute', top: -12, right: -12,
                  background: 'var(--violet)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  boxShadow: '0 8px 24px var(--violet-glow)',
                  fontSize: 13, fontWeight: 600, color: 'white',
                }}
              >
                🔥 Trending Now
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Responsive override */}
        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-img-col { display: none; }
          }
        `}</style>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: 'var(--ink-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '14px 0', overflow: 'hidden' }}>
        <div className="marquee-track" style={{ gap: 32, padding: '0 16px' }}>
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: '72px 0', background: 'var(--ink)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {STATS.map(({ value, label }, i) => (
              <RevealDiv key={label} delay={i * 80} style={{
                padding: '32px 24px',
                textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div className="font-display" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, marginBottom: 8, background: 'linear-gradient(135deg, #fff, var(--violet-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {value}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ── */}
      <section style={{ padding: '80px 0', background: 'var(--ink-2)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <RevealDiv style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p className="section-label" style={{ marginBottom: 10 }}>Curated Picks</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                Featured Events
              </h2>
            </div>
            <Link to="/events" className="btn-ghost" style={{ gap: 6, color: 'var(--violet-light)' }}>
              View all events <ArrowRight size={16} />
            </Link>
          </RevealDiv>

          {featuredEvents.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {featuredEvents.map((event, i) => (
                <EventCard key={event._id} event={event} index={i} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <Sparkles size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
              <p>No featured events yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 0', background: 'var(--ink)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <RevealDiv style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Why Eventify</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
              Built for the best experiences
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
              Every feature is crafted to make discovering, booking, and hosting events effortless.
            </p>
          </RevealDiv>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, glow }, i) => (
              <RevealDiv key={title} delay={i * 100} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '32px 28px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 24px 48px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: glow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  border: `1px solid ${color}30`,
                }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, rgba(124,92,252,0.12) 0%, rgba(245,166,35,0.06) 100%)',
        borderTop: '1px solid var(--border)',
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ textAlign: 'center' }}>
          <RevealDiv>
            <p className="section-label" style={{ marginBottom: 16 }}>Start Today</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 20 }}>
              Your next great event<br />is waiting for you
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 40px' }}>
              Join thousands of event-goers and organizers who trust Eventify to make every experience unforgettable.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn-primary" style={{ padding: '15px 32px', fontSize: 16 }}>
                Get Started Free <ArrowUpRight size={17} />
              </Link>
              <Link to="/events" className="btn-outline" style={{ padding: '15px 32px', fontSize: 16 }}>
                Browse Events
              </Link>
            </div>
          </RevealDiv>
        </div>
      </section>
    </div>
  );
}

export default Home;
