import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Save, Shield, Mail, Phone, User, FileText,
  Palette, Eye, EyeOff, Check, Lock, AlertCircle, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

const PWD_RULES = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'Contains a letter',     test: p => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number',     test: p => /\d/.test(p) },
];

function PasswordSection({ onSave }) {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]     = useState({ current: false, next: false });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const strength = PWD_RULES.filter(r => r.test(form.next)).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', 'text-red-500', 'text-yellow-500', 'text-green-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (strength < 3) { setError('New password does not meet all requirements.'); return; }
    if (form.next !== form.confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    const result = await onSave(form.next);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    setSuccess(true);
    setForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> Password updated successfully!
        </div>
      )}

      {/* New password */}
      <div>
        <label className="form-label">New Password</label>
        <div className="relative">
          <input
            type={show.next ? 'text' : 'password'}
            value={form.next}
            onChange={e => { setForm(f => ({...f, next: e.target.value})); setError(''); }}
            placeholder="Enter new password"
            className="input-field pr-12"
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShow(s => ({...s, next: !s.next}))}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            {show.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.next && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1,2,3].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= strength ? ['bg-red-400','bg-yellow-400','bg-green-500'][strength-1] : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                ))}
              </div>
              <span className={`text-xs font-semibold ${strengthColor}`}>{strengthLabel}</span>
            </div>
            {PWD_RULES.map(r => (
              <div key={r.label} className={`flex items-center gap-2 text-xs transition-colors ${r.test(form.next) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <Check className="w-3 h-3" /> {r.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm */}
      <div>
        <label className="form-label">Confirm New Password</label>
        <div className="relative">
          <input
            type={show.next ? 'text' : 'password'}
            value={form.confirm}
            onChange={e => { setForm(f => ({...f, confirm: e.target.value})); setError(''); }}
            placeholder="Re-enter new password"
            className={`input-field ${form.confirm && form.confirm !== form.next ? 'border-red-400 dark:border-red-600' : ''}`}
            autoComplete="new-password"
          />
          {form.confirm && form.confirm === form.next && (
            <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
        </div>
        {form.confirm && form.confirm !== form.next && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>

      <button type="submit" disabled={saving || !form.next || !form.confirm}
        className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-60">
        <Lock className="w-4 h-4" />
        {saving ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  );
}

export default function Profile() {
  const { user, authUser, updateProfile, uploadAvatar, resetPassword } = useAuth();

  const [form, setForm]   = useState({ name: user?.name||'', bio: user?.bio||'', phone: user?.phone||'' });
  const [saving, setSave] = useState(false);
  const [avLoad, setAvL]  = useState(false);
  const [pwdOpen, setPwd] = useState(false);

  // Detect auth provider — Google users can't set a password
  const provider       = authUser?.app_metadata?.provider || 'email';
  const isGoogleUser   = provider === 'google';
  const isEmailUser    = provider === 'email' || !provider;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSave(true);
    const result = await updateProfile({ name: form.name.trim(), bio: form.bio.trim(), phone: form.phone.trim() });
    setSave(false);
    result.success ? toast.success('Profile saved!') : toast.error(result.error);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast.error('Max file size is 2 MB.'); return; }
    setAvL(true);
    const result = await uploadAvatar(file);
    setAvL(false);
    result.success ? toast.success('Avatar updated!') : toast.error(result.error);
  };

  const handlePasswordChange = async (newPassword) => {
    return await resetPassword(newPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white mb-8">Account Settings</h1>

        {/* ── Profile card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8 mb-6">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=6366f1&color=fff&size=200`}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
              />
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow">
                {avLoad
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />
                }
                <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" disabled={avLoad} />
              </label>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{user?.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  user?.role==='admin' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  : user?.role==='organizer' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {(user?.role||'user').charAt(0).toUpperCase()+(user?.role||'user').slice(1)}
                </span>
                {isGoogleUser && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="form-label flex items-center gap-2"><User className="w-3.5 h-3.5" /> Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                className="input-field" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="form-label flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}
                className="input-field" placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className="form-label flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))}
                rows={3} className="input-field resize-none" placeholder="Tell us about yourself…" />
            </div>
            <div>
              <label className="form-label flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</label>
              <input type="email" value={user?.email||''} disabled
                className="input-field bg-gray-50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">
                {isGoogleUser ? 'Managed by your Google account.' : 'Managed by your authentication provider.'}
              </p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5">
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* ── Appearance ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Palette className="w-4.5 h-4.5 text-primary-500 w-[18px] h-[18px]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Appearance</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose your preferred colour scheme</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </motion.div>

        {/* ── Security / Password ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                <Shield className="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isGoogleUser ? 'Managed by Google' : 'Manage your password'}
                </p>
              </div>
            </div>
            {isEmailUser && (
              <button onClick={() => setPwd(v => !v)}
                className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                {pwdOpen ? 'Cancel' : 'Change Password'}
              </button>
            )}
          </div>

          {/* Google user info */}
          {isGoogleUser && (
            <div className="mt-4 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>You signed in with Google. Your password is managed by Google and cannot be changed here. To update it, visit your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Account security settings</a>.</p>
            </div>
          )}

          {/* Email user — expandable password form */}
          {isEmailUser && (
            <AnimatePresence>
              {pwdOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-800">
                    <PasswordSection onSave={handlePasswordChange} />
                  </div>
                </motion.div>
              )}
              {!pwdOpen && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  Use a strong password with at least 8 characters, a mix of letters and numbers.
                </motion.p>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
