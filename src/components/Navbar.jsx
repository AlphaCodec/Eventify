import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar, Menu, X, LogOut, LayoutDashboard, Heart,
  Bell, ChevronDown, Shield, Plus, User, Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationsContext';
import { useConfirm } from '../hooks/useConfirm';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

// Portal dropdown — renders at document.body level so it is never clipped
// by any parent overflow/transform, and always stays within the viewport.
function NotificationPortal({ anchorRef, onClose, notifications, unreadCount, markAllRead }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const PANEL_W = Math.min(360, window.innerWidth - 16); // 8px margin each side
    // Align right edge of panel to right edge of button, but clamp to viewport
    let left = rect.right - PANEL_W;
    if (left < 8) left = 8; // don't let it bleed off left edge
    setPos({ top: rect.bottom + window.scrollY + 8, left, width: PANEL_W });
  }, [anchorRef]);

  return createPortal(
    <>
      {/* Invisible full-screen backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      <div
        style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width }}
        className="z-[9999] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={() => { markAllRead(); }}
              className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {!notifications.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
          ) : notifications.map(n => (
            <div key={n.id}
              className={`px-4 py-3 text-sm ${
                n.read
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white bg-primary-50/50 dark:bg-primary-900/20'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {!n.read && (
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug">{n.title}</p>
                  {n.message && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-relaxed break-words">
                      {n.message}
                    </p>
                  )}
                  <p className="text-gray-400 text-[10px] mt-1">
                    {new Date(n.created_at).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

export default function Navbar() {
  const { user, logout, isAdmin }          = useAuth();
  const { wishlistIds }                    = useWishlist();
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const { confirm }                        = useConfirm();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [mobileOpen, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDrop]     = useState(false);
  const [notifOpen, setNotif]   = useState(false);
  const dropRef  = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobile(false); setDrop(false); setNotif(false); }, [location]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Sign Out', text: 'Are you sure you want to sign out?', confirmText: 'Sign Out' });
    if (ok) { await logout(); toast.success('Signed out successfully.'); navigate('/'); }
  };

  const handleNotifOpen = () => {
    setNotif(v => !v);
    setDrop(false);
    if (!notifOpen && unreadCount > 0) markAllRead();
  };

  return (
    <nav className={`sticky top-0 z-50 bg-white dark:bg-gray-900 transition-shadow duration-300 ${scrolled ? 'shadow-md dark:shadow-gray-900/50' : 'border-b border-gray-100 dark:border-gray-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Eventify</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[{ to: '/', label: 'Home' }, { to: '/events', label: 'Events' }].map(l => (
              <Link key={l.to} to={l.to}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive(l.to) ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Wishlist */}
                <Link to="/wishlist" className="relative p-2 rounded-lg text-gray-500 hover:text-primary-500 hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5" />
                  {wishlistIds.size > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {wishlistIds.size > 9 ? '9+' : wishlistIds.size}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button onClick={handleNotifOpen} className="relative p-2 rounded-lg text-gray-500 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <NotificationPortal
                      anchorRef={notifRef}
                      onClose={() => setNotif(false)}
                      notifications={notifications}
                      unreadCount={unreadCount}
                      markAllRead={markAllRead}
                    />
                  )}
                </div>

                {/* Theme Toggle */}
                <ThemeToggle compact />

                {/* User Dropdown */}
                <div ref={dropRef} className="relative">
                  <button onClick={() => { setDrop(v => !v); setNotif(false); }}
                    className="group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=80`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary-100"
                    />
                    <span className="hidden sm:block text-sm font-semibold 
text-gray-900 dark:text-white 
group-hover:text-gray-900 dark:group-hover:text-gray-900 
max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdown && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      {[
                        { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
                        { to: '/wishlist',     icon: Heart,           label: 'Wishlist' },
                        { to: '/create-event', icon: Plus,            label: 'Create Event' },
                        { to: '/profile',      icon: Settings,        label: 'Settings' },
                        ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin Panel' }] : []),
                      ].map(item => (
                        <Link key={item.to} to={item.to}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <item.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" /> {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"  className="hidden sm:block text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Sign In</Link>
                <Link to="/signup" className="btn-primary text-sm px-4 py-2">Get Started</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg" onClick={() => setMobile(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          {[{ to: '/', label: 'Home' }, { to: '/events', label: 'Events' }].map(l => (
            <Link key={l.to} to={l.to} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">{l.label}</Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard"    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Dashboard</Link>
              <Link to="/wishlist"     className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Wishlist</Link>
              <Link to="/create-event" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Create Event</Link>
              <Link to="/profile"      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Settings</Link>
              {isAdmin && <Link to="/admin" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Admin Panel</Link>}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                <ThemeToggle compact />
              </div>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login"  className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Sign In</Link>
              <Link to="/signup" className="block px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">Get Started</Link>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                <ThemeToggle compact />
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
