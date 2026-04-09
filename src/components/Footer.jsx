import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Instagram, Linkedin, ArrowUpRight } from 'lucide-react';

const categories = ['Music', 'Technology', 'Food & Drink', 'Sports', 'Arts', 'Business'];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: 'var(--ink-2)', borderTop: '1px solid var(--border)' }}>
      {/* CTA band */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,92,252,0.15) 0%, rgba(245,166,35,0.06) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 0',
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>Ready to host?</p>
            <h3 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Create your event today
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/create-event" className="btn-primary">
              Get Started <ArrowUpRight size={16} />
            </Link>
            <Link to="/events" className="btn-outline">Browse Events</Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="white" />
              </div>
              <span className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>Eventify</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              Discover and create extraordinary event experiences, all in one place.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="btn-ghost" style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Explore</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Events', '/events'], ['Create Event', '/create-event'], ['Dashboard', '/dashboard']].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Categories</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categories.slice(0, 4).map((cat) => (
                <li key={cat}>
                  <Link to="/events" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Support</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((label) => (
                <li key={label}>
                  <a href="#" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            © {currentYear} Eventify. Built by{' '}
            <a href="https://biela.dev/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--violet-light)', textDecoration: 'none' }}>Biela.dev</a>
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="tag tag-surface" style={{ fontSize: 11 }}>✦ Powered by Stripe</span>
            <span className="tag tag-violet" style={{ fontSize: 11 }}>🔒 SSL Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
