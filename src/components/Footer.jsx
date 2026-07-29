import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Mail, Github, Twitter, Instagram, Heart } from 'lucide-react';
import { CATEGORIES } from '../data/eventsData';

const LINKS = {
  Platform: [
    { label: 'Browse Events', to: '/events' },
    { label: 'Create Event', to: '/create-event' },
    { label: 'My Dashboard', to: '/dashboard' },
    { label: 'Saved Events', to: '/wishlist' },
  ],
  Company: [
    { label: 'About Us', to: '/#' },
    { label: 'Blog', to: '/#' },
    { label: 'Careers', to: '/#' },
    { label: 'Contact', to: '/#' },
  ],
  Support: [
    { label: 'Help Center', to: '/#' },
    { label: 'Privacy Policy', to: '/#' },
    { label: 'Terms of Service', to: '/#' },
    { label: 'Cookie Settings', to: '/#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-extrabold text-white">Eventify</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 mb-6 max-w-xs">
              Discover and book extraordinary events. We connect passionate people with
              unforgettable experiences — from concerts to conferences.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {[
                { Icon: Twitter,   href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Github,    href: '#' },
                { Icon: Mail,      href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-primary-500/20 hover:text-primary-400 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-gray-500 hover:text-primary-400 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Categories strip */}
        <div className="py-5 border-t border-white/5">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-3 font-bold">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c !== 'All Events').map((cat) => (
              <Link
                key={cat}
                to={`/events?category=${cat}`}
                className="text-xs text-gray-600 hover:text-primary-400 px-3 py-1 rounded-full border border-white/5 hover:border-primary-500/30 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Eventify. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> using React · Tailwind CSS · Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}
