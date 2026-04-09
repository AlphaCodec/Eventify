import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const InputRow = ({ label, type, value, onChange, placeholder, icon: Icon }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="input-field" style={{ paddingLeft: 42 }} />
    </div>
  </div>
);

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const swalConfig = { background: '#1e1e2e', color: '#f0f0fa', confirmButtonColor: '#7c5cfc' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      Swal.fire({ ...swalConfig, title: 'Missing fields', text: 'Please fill in all fields', icon: 'warning' }); return;
    }
    if (password !== confirmPassword) {
      Swal.fire({ ...swalConfig, title: 'Passwords don\'t match', icon: 'error' }); return;
    }
    if (password.length < 6) {
      Swal.fire({ ...swalConfig, title: 'Password too short', text: 'Minimum 6 characters', icon: 'warning' }); return;
    }
    setIsLoading(true);
    try {
      const user = await signup(name, email, password);
      Swal.fire({ ...swalConfig, title: `Welcome, ${user.name}! 🎉`, icon: 'success', timer: 1800, showConfirmButton: false })
        .then(() => navigate('/'));
    } catch (err) {
      Swal.fire({ ...swalConfig, title: 'Signup failed', text: err.message, icon: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -200, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 2 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--violet-glow)' }}>
              <Sparkles size={18} color="white" />
            </div>
            <span className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Eventify</span>
          </Link>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Join thousands of event lovers today</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <InputRow label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" icon={User} />
            <InputRow label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={Mail} />

            {/* Password with toggle */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field" style={{ paddingLeft: 42, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" className="input-field" style={{ paddingLeft: 42 }} />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>Passwords don't match</p>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginTop: 4 }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Creating account...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Create Account <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--violet-light)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Signup;
