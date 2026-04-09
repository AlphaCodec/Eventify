import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, LogOut, LayoutDashboard, Plus, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Logging out?',
      text: "We'll miss you.",
      icon: 'question',
      showCancelButton: true,
      background: '#1e1e2e',
      color: '#f0f0fa',
      confirmButtonColor: '#7c5cfc',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, logout',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/');
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-200 ${
        isActive(to) ? 'text-white' : 'text-tx-secondary hover:text-white'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(10,10,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--violet)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px var(--violet-glow)',
              transition: 'box-shadow 0.3s',
            }} className="group-hover:animate-glow-pulse">
              <Sparkles size={16} color="white" />
            </div>
            <span className="font-display font-700 text-xl text-white tracking-tight">Eventify</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLink('/events', 'Events')}
            {navLink('/create-event', 'Create')}
            {user && navLink('/dashboard', 'Dashboard')}
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-amber-DEFAULT hover:text-amber-300 transition-colors">
                <LayoutDashboard size={14} />
                Admin
              </Link>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-hover)', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{user.name}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 10px' }}>
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/signup" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden btn-ghost"
            style={{ padding: '8px' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden animate-slide-up" style={{
          background: 'rgba(18,18,26,0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          padding: '16px 24px 24px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { to: '/events', label: 'Events', icon: <Ticket size={16} /> },
              { to: '/create-event', label: 'Create Event', icon: <Plus size={16} /> },
              ...(user ? [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }] : []),
            ].map(({ to, label, icon }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 8px', color: isActive(to) ? 'white' : 'var(--text-secondary)',
                fontSize: 15, fontWeight: 500, borderRadius: 8, transition: 'all 0.2s',
                background: isActive(to) ? 'rgba(124,92,252,0.1)' : 'transparent',
              }}>
                {icon} {label}
              </Link>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={user.avatar} alt={user.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px', color: '#f87171' }}>
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                <Link to="/login" className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Login</Link>
                <Link to="/signup" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
