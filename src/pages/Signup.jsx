import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff, Check, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a letter',     test: (p) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number',     test: (p) => /\d/.test(p) },
];

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoad]  = useState(false);
  const [apiError, setApiErr] = useState('');
  const [confirmed, setConfirmed] = useState(false); // email confirm flow

  const pwdStrength = PASSWORD_RULES.filter(r => r.test(form.password)).length;

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)     e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'At least 8 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setApiErr('');
    setLoading(true);
    const result = await signup(form.name, form.email, form.password);
    setLoading(false);
    if (!result.success) { setApiErr(result.error); return; }
    if (result.needsConfirmation) { setConfirmed(true); return; }
    toast.success(`🎉 Welcome to Eventify, ${form.name}!`);
    navigate('/');
  };

  const handleGoogle = async () => {
    setGLoad(true);
    const result = await loginWithGoogle();
    if (!result.success) { toast.error(result.error); setGLoad(false); }
  };

  const handleChange = (key, val) => {
    setForm({ ...form, [key]: val });
    if (errors[key]) setErrors({ ...errors, [key]: '' });
    setApiErr('');
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-10 shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Confirm your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a confirmation link to <strong>{form.email}</strong>. Click the link to activate your account.
          </p>
          <Link to="/login" className="btn-primary w-full flex items-center justify-center">Back to Sign In</Link>
        </motion.div>
      </div>
    );
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][pwdStrength];
  const strengthColor = ['', 'text-red-500', 'text-yellow-500', 'text-green-500'][pwdStrength];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-md p-10 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white">Create account</h2>
          <p className="text-gray-500 mt-2 text-sm">Join Eventify and start exploring</p>
        </div>

        <button onClick={handleGoogle} disabled={gLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4 disabled:opacity-60">
          {gLoading ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-xl px-4 py-3 text-sm font-medium mb-5">{apiError}</div>
          )}

          {[
            { key: 'name',  label: 'Full Name',       type: 'text',     placeholder: 'Jane Smith' },
            { key: 'email', label: 'Email Address',   type: 'email',    placeholder: 'you@example.com' },
          ].map(f => (
            <div key={f.key} className="mb-4">
              <label className="form-label">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={`input-field ${errors[f.key] ? 'border-red-400' : ''}`}
              />
              {errors[f.key] && <p className="error-message">{errors[f.key]}</p>}
            </div>
          ))}

          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="••••••••"
                className={`input-field pr-12 ${errors.password ? 'border-red-400' : ''}`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="error-message">{errors.password}</p>}
            {form.password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= pwdStrength ? ['bg-red-400','bg-yellow-400','bg-green-500'][pwdStrength-1] : 'bg-gray-200'}`} />
                  ))}
                  <span className={`text-xs font-medium ml-1 ${strengthColor}`}>{strengthLabel}</span>
                </div>
                {PASSWORD_RULES.map(r => (
                  <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="w-3 h-3" /> {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="form-label">Confirm Password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.confirm}
              onChange={e => handleChange('confirm', e.target.value)}
              placeholder="••••••••"
              className={`input-field ${errors.confirm ? 'border-red-400' : ''}`}
              autoComplete="new-password"
            />
            {errors.confirm && <p className="error-message">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base shadow-glow">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
