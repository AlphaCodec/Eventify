import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a letter',     test: (p) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number',     test: (p) => /\d/.test(p) },
];

export default function ResetPassword() {
  const { resetPassword, authUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ password: '', confirm: '' });
  const [showPwd, setShow]  = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');

  // Supabase puts the access token in the URL hash after redirect
  useEffect(() => {
    if (!authUser) navigate('/login', { replace: true });
  }, [authUser, navigate]);

  const strength = RULES.filter(r => r.test(form.password)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (strength < 3) { setError('Password does not meet requirements.'); return; }
    setLoad(true);
    const result = await resetPassword(form.password);
    setLoad(false);
    if (!result.success) { setError(result.error); return; }
    toast.success('Password updated! Please sign in.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-10 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white">Set new password</h2>
          <p className="text-gray-500 mt-2 text-sm">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-xl px-4 py-3 text-sm font-medium mb-5">{error}</div>
          )}
          <div className="mb-4">
            <label className="form-label">New Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-field pr-12"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShow(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {form.password && (
              <div className="mt-3 space-y-1.5">
                <div className="flex gap-1 mb-2">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? ['bg-red-400','bg-yellow-400','bg-green-500'][strength-1] : 'bg-gray-200'}`} />
                  ))}
                </div>
                {RULES.map(r => (
                  <div key={r.label} className={`flex items-center gap-2 text-xs ${r.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>
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
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating…
              </span>
            ) : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
