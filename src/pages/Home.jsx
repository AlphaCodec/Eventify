import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Calendar, ArrowRight, Zap,
  TrendingUp, Shield, Bell, QrCode,
} from 'lucide-react';
import { useEvents } from '../context/EventContext';
import EventCard from '../components/EventCard';
import HeroCarousel from '../components/HeroCarousel';

const FEATURES = [
  { icon: Search,    title: 'Easy Discovery',    desc: 'Find events that match your interests with powerful search, smart filtering, and category browsing.', color: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' },
  { icon: Calendar,  title: 'Instant Booking',   desc: 'Book Standard or VIP tickets in seconds. Your e-ticket and QR code are ready immediately.',            color: 'bg-accent-100  dark:bg-accent-900/40  text-accent-600  dark:text-accent-400' },
  { icon: QrCode,    title: 'Digital E-Tickets', desc: 'Each booking generates a unique QR code ticket you can present at the door — no printing needed.',     color: 'bg-green-100   dark:bg-green-900/40   text-green-600   dark:text-green-400' },
  { icon: Bell,      title: 'Real-time Updates', desc: 'Get instant notifications for booking confirmations, reminders, and event updates via the platform.',    color: 'bg-amber-100   dark:bg-amber-900/40   text-amber-600   dark:text-amber-400' },
  { icon: Shield,    title: 'Secure & Reliable', desc: 'Powered by Supabase with row-level security, OAuth, and encrypted sessions — your data is safe.',       color: 'bg-blue-100    dark:bg-blue-900/40    text-blue-600    dark:text-blue-400' },
  { icon: TrendingUp,title: 'Organiser Tools',   desc: 'Create events, upload images, track attendees and revenue — all from a clean dashboard.',              color: 'bg-purple-100  dark:bg-purple-900/40  text-purple-600  dark:text-purple-400' },
];

const STATS = [
  { value: '200+', label: 'Events Listed' },
  { value: '25K+', label: 'Happy Attendees' },
  { value: '50+',  label: 'Cities Covered' },
  { value: '4.9★', label: 'Avg Rating' },
];

export default function Home() {
  const { events, loading } = useEvents();
  const featured    = events.filter(e => e.featured).slice(0, 6);
  // If fewer than 2 featured events, supplement with most-popular events so the carousel always has content
  const carouselEvents = featured.length >= 2
    ? featured
    : [...events].sort((a, b) => (b.attendees || 0) - (a.attendees || 0)).slice(0, 6);
  const recent      = [...events].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);

  const SkeletonCard = () => (
    <div className="card animate-pulse h-80">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient ticket-bg min-h-[580px] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-400/30 text-primary-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7">
                <Zap className="w-3.5 h-3.5 fill-primary-400" /> Your event journey starts here
              </div>
              <h1 className="font-display text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6">
                Discover <span className="gradient-text">Amazing Events</span> Near You
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
                Join thousands of people discovering and attending incredible experiences. From concerts to conferences — book your next great memory today.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/events" className="btn-primary text-base py-3.5 px-8 shadow-glow inline-flex items-center gap-2">
                  Explore Events <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/create-event" className="inline-flex items-center gap-2 text-base py-3.5 px-8 border-2 border-white/20 text-white hover:border-primary-400 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-all">
                  Host an Event
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative hidden lg:block">
              <HeroCarousel events={carouselEvents} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 py-7">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="text-center">
              <p className="font-display text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-primary-100 text-sm mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Events */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Events</h2>
              <p className="section-subtitle">Don't miss out on these handpicked experiences</p>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:text-primary-700 dark:hover:text-primary-300">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
          ) : featured.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-12">No featured events yet. Check back soon!</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <EventCard event={e} />
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center mt-8 sm:hidden">
            <Link to="/events" className="btn-secondary text-sm inline-flex items-center gap-2">View all events <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Why Choose Eventify?</h2>
            <p className="section-subtitle">Everything you need for unforgettable event experiences</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                className="card p-7 hover:shadow-card-hover transition-shadow duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      {(loading || recent.length > 0) && (
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">Recently Added</h2>
                <p className="section-subtitle">Fresh events just posted to the platform</p>
              </div>
              <Link to="/events" className="hidden sm:flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:text-primary-700 dark:hover:text-primary-300">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recent.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                    <EventCard event={e} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 hero-gradient">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-black text-white mb-5">Ready to Host Your Own Event?</h2>
          <p className="text-gray-400 text-lg mb-8">Join hundreds of organisers using Eventify to reach thousands of attendees. Create your first event in minutes — it's free.</p>
          <Link to="/create-event" className="btn-primary text-base py-3.5 px-10 shadow-glow inline-flex items-center gap-2">
            Create Event Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
