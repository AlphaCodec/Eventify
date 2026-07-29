import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from || '/';

  const [form,     setForm]    = useState({ email: '', password: '' });
  const [errors,   setErrors]  = useState({});
  const [showPwd,  setShowPwd] = useState(false);
  const [loading,  setLoading] = useState(false);
  const [gLoading, setGLoad]   = useState(false);
  const [apiError, setApiErr]  = useState('');

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = 'Email is required.';
    if (!form.password.trim()) e.password = 'Password is required.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setApiErr('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (!result.success) {
      setApiErr(result.error);
      return;
    }
    toast.success('Welcome back! 👋');
    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setGLoad(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      toast.error(result.error);
      setGLoad(false);
    }
    // On success Supabase redirects the page automatically — no navigate() needed
  };

  const handleChange = (key, val) => {
    setForm({ ...form, [key]: val });
    if (errors[key]) setErrors({ ...errors, [key]: '' });
    setApiErr('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-md p-10 shadow-xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white">Welcome back</h2>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your Eventify account</p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={gLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4 disabled:opacity-60"
        >
          {gLoading
            ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )
          }
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleSubmit} noValidate>
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium mb-5">
              {apiError}
            </div>
          )}

          <div className="mb-4">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="you@example.com"
              className={`input-field ${errors.email ? 'border-red-400' : ''}`}
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="••••••••"
                className={`input-field pr-12 ${errors.password ? 'border-red-400' : ''}`}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || gLoading}
            className="btn-primary w-full py-3.5 text-base shadow-glow mt-6 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" /> Sign In
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 font-bold hover:text-primary-700">
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
