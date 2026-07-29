import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Lock, CreditCard, Calendar, MapPin, Shield,
  Server, CheckCircle, AlertCircle, Ticket,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useEvents } from '../context/EventContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatShortDate, formatTime } from '../utils/helpers';

// Load Stripe once outside the component — avoids re-creating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ── Stripe element style (syncs with app theme) ────────────────────────────
const getStripeStyle = (isDark) => ({
  base: {
    color:           isDark ? '#f1f5f9' : '#1e293b',
    fontFamily:      '"DM Sans", sans-serif',
    fontSmoothing:   'antialiased',
    fontSize:        '15px',
    '::placeholder': { color: isDark ? '#64748b' : '#9ca3af' },
  },
  invalid: { color: '#ef4444', iconColor: '#ef4444' },
});

export default function PaymentModal({ event, ticketType, quantity, onClose, onSuccess }) {
  const { user }                               = useAuth();
  const { createBooking }                      = useBookings();
  const { incrementAttendees }                 = useEvents();
  const isDark = document.documentElement.classList.contains('dark');

  // Refs for Stripe element mount points
  const cardNumRef  = useRef(null);
  const cardExpRef  = useRef(null);
  const cardCvcRef  = useRef(null);
  const postalRef   = useRef(null);

  // Stripe instances
  const stripeRef   = useRef(null);
  const cardNumEl   = useRef(null);
  const cardExpEl   = useRef(null);
  const cardCvcEl   = useRef(null);
  const postalEl    = useRef(null);

  // UI state
  const [ready,       setReady]     = useState(false);
  const [fieldError,  setFieldErr]  = useState('');
  const [processing,  setProcessing] = useState(false);
  const [phase,       setPhase]     = useState('form'); // 'form' | 'animating' | 'success' | 'error'
  const [errorMsg,    setErrorMsg]  = useState('');

  // Animation state
  const [progress,    setProgress]  = useState(0);
  const [stages,      setStages]    = useState({ s1:'', s2:'', s3:'', s4:'' });
  const [animElems,   setAnimElems] = useState({ card:false, terminal:false, shield:false, server:false, path:false, success:false });
  const [serverLights,setLights]    = useState({ l1:false, l2:false, l3:false });
  const [particles,   setParticles] = useState([]);
  const [processingMsg, setProcMsg] = useState({ title:'', sub:'' });

  const price     = ticketType === 'vip' ? event.price_vip : event.price;
  const total     = price * quantity;
  const totalCents = Math.round(total * 100);

  // ── Mount Stripe elements ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    stripePromise.then(stripe => {
      if (!mounted || !stripe) return;
      stripeRef.current = stripe;
      const els  = stripe.elements();
      const style = getStripeStyle(isDark);

      const cn = els.create('cardNumber', { style, showIcon: true, placeholder: '1234 5678 9012 3456' });
      const ce = els.create('cardExpiry', { style, placeholder: 'MM / YY' });
      const cv = els.create('cardCvc',    { style, placeholder: 'CVC' });
      const pc = els.create('postalCode', { style, placeholder: 'ZIP / Postal' });

      cn.mount(cardNumRef.current);
      ce.mount(cardExpRef.current);
      cv.mount(cardCvcRef.current);
      pc.mount(postalRef.current);

      cardNumEl.current = cn;
      cardExpEl.current = ce;
      cardCvcEl.current = cv;
      postalEl.current  = pc;

      const onErr = (e) => setFieldErr(e.error?.message || '');
      cn.on('change', onErr); ce.on('change', onErr);
      cv.on('change', onErr); pc.on('change', onErr);

      cn.on('ready', () => mounted && setReady(true));
    });

    return () => {
      mounted = false;
      cardNumEl.current?.destroy();
      cardExpEl.current?.destroy();
      cardCvcEl.current?.destroy();
      postalEl.current?.destroy();
    };
  }, []); // eslint-disable-line

  // ── Prevent body scroll while open ─────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Animation sequence — returns a Promise that resolves when all stages done ─
  // Total runtime ~9 s so the full sequence always plays out before we reveal
  // success/error, even if the network came back instantly.
  const runAnimation = useCallback(() => {
    // Reset
    setAnimElems({ card:false, terminal:false, shield:false, server:false, path:false, success:false });
    setLights({ l1:false, l2:false, l3:false });
    setStages({ s1:'', s2:'', s3:'', s4:'' });
    setProgress(0);
    setParticles([]);

    const t = (ms, fn) => new Promise(res => setTimeout(() => { fn(); res(); }, ms));

    return Promise.all([
      // Stage 1 — Card detected (t = 600 ms)
      t(600, () => {
        setStages(s => ({ ...s, s1:'active' }));
        setAnimElems(a => ({ ...a, card: true }));
        setProgress(12);
      }),
      // Stage 1 → 2 — Terminal handshake (t = 1 800 ms)
      t(1800, () => {
        setStages(s => ({ ...s, s1:'completed', s2:'active' }));
        setAnimElems(a => ({ ...a, terminal: true }));
        setProgress(30);
      }),
      // Stage 2 → 3 — Encryption burst (t = 3 400 ms)
      t(3400, () => {
        setStages(s => ({ ...s, s2:'completed', s3:'active' }));
        setAnimElems(a => ({ ...a, shield: true }));
        const ps = Array.from({ length: 24 }, (_, i) => ({
          id: i, top: Math.random()*80+10, delay: Math.random()*2,
        }));
        setParticles(ps);
        setProgress(52);
      }),
      // Stage 3 → 4 — Bank transfer (t = 5 400 ms)
      t(5400, () => {
        setStages(s => ({ ...s, s3:'completed', s4:'active' }));
        setAnimElems(a => ({ ...a, server: true, path: true }));
        setProgress(74);
      }),
      // Server lights blink on one-by-one
      t(6000, () => setLights(l => ({ ...l, l1: true }))),
      t(6700, () => setLights(l => ({ ...l, l2: true }))),
      t(7400, () => { setLights(l => ({ ...l, l3: true })); setProgress(88); }),
      // Hold at 88 % so the user sees the server fully lit before we finish
      t(9000, () => setProgress(95)),
    ]);
  }, []);

  // ── Ripple on button ────────────────────────────────────────────────────
  const addRipple = (e) => {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left  = `${e.clientX - btn.getBoundingClientRect().left - d/2}px`;
    circle.style.top   = `${e.clientY - btn.getBoundingClientRect().top  - d/2}px`;
    circle.className   = 'pm-ripple';
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 700);
  };

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripeRef.current || !cardNumEl.current || !ready) return;

    setFieldErr('');
    setProcessing(true);

    try {
      // ① Tokenise the card BEFORE changing phase — switching phase unmounts
      //    the form DOM, which destroys the Stripe iframes.  confirmCardPayment
      //    called after that throws "could not retrieve data from the Element".
      //    Creating a PaymentMethod now captures the card data while the
      //    elements are still alive; we use the resulting pm.id string later.
      const { error: pmErr, paymentMethod } = await stripeRef.current.createPaymentMethod({
        type: 'card',
        card: cardNumEl.current,
        billing_details: { email: user?.email || undefined },
      });

      if (pmErr) {
        setFieldErr(pmErr.message || 'Invalid card details');
        setProcessing(false);
        return;
      }

      // ② Now it's safe to show the animation — card data is already captured
      setPhase('animating');
      setProcMsg({ title: 'Processing your payment', sub: 'Please wait while we securely process your transaction' });
      const animationDone = runAnimation();

      // ③ Create payment intent via Supabase Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;

      const res = await fetch(fnUrl, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          amount:   totalCents,
          currency: 'usd',
          metadata: {
            event_id:    event.id,
            event_title: event.title,
            user_id:     user?.id,
            ticket_type: ticketType,
            quantity,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Could not create payment intent');

      setProcMsg({ title: 'Confirming payment', sub: 'Authorising your payment method…' });

      // ④ Confirm using the PaymentMethod ID (a plain string — no DOM element needed)
      const { error: stripeErr, paymentIntent } = await stripeRef.current.confirmCardPayment(
        json.clientSecret,
        { payment_method: paymentMethod.id }
      );

      if (stripeErr) throw stripeErr;

      if (paymentIntent.status === 'succeeded') {
        // Wait for the full animation before revealing success
        await animationDone;

        setStages(s => ({ ...s, s4:'completed' }));
        setProgress(100);

        setTimeout(() => {
          setAnimElems(a => ({ ...a, success: true }));
          setProcMsg({ title: 'Payment Successful! 🎉', sub: 'Creating your booking…' });
        }, 800);

        // ④ Create booking in Supabase
        const booking = await createBooking({ ticketType, quantity }, event);
        await incrementAttendees(event.id, quantity);

        setTimeout(() => {
          setPhase('success');
          setProcessing(false);
          // Notify parent after showing success state briefly
          setTimeout(() => onSuccess(booking), 1800);
        }, 2200);
      }

    } catch (err) {
      setProgress(100);
      setErrorMsg(err.message || 'Payment failed. Please try again.');
      setProcMsg({ title: 'Payment Failed', sub: err.message || 'There was an issue processing your payment.' });
      setTimeout(() => {
        setPhase('error');
        setProcessing(false);
      }, 2000);
    }
  };

  const stageClass = (key) => stages[key] || '';

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={(e) => e.target === e.currentTarget && !processing && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold font-display flex items-center gap-2">
                  <Lock className="w-5 h-5" /> Secure Payment
                </h2>
                <p className="text-primary-200 text-sm mt-0.5">Complete your booking for</p>
                <p className="font-bold mt-1 text-base leading-tight line-clamp-1">{event.title}</p>
              </div>
              {!processing && (
                <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ml-3 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Processing overlay (replaces body when animating/success/error) ── */}
          {(phase === 'animating' || phase === 'success' || phase === 'error') && (
            <div className="bg-slate-900 p-8 text-white text-center">
              {/* Animation canvas */}
              <div className="pm-payment-animation-container">
                {/* Card */}
                <div className={`pm-payment-card ${animElems.card ? 'animate' : ''}`}>
                  <CreditCard className="w-8 h-8" />
                </div>
                {/* Terminal */}
                <div className="pm-payment-terminal">
                  <div className="pm-terminal-screen">
                    <div className={`pm-terminal-text ${animElems.terminal ? 'animate' : ''}`}>PROCESSING...</div>
                  </div>
                  <div className="pm-terminal-slot" />
                </div>
                {/* Data particles */}
                <div className="pm-data-particles">
                  {particles.map(p => (
                    <div key={p.id} className="pm-data-particle animate"
                      style={{ top: `${p.top}%`, animationDelay: `${p.delay}s` }} />
                  ))}
                </div>
                {/* Encryption shield */}
                <div className={`pm-encryption-shield ${animElems.shield ? 'animate' : ''}`}>
                  <div className="pm-shield-glow" />
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Bank server */}
                <div className={`pm-bank-server ${animElems.server ? 'animate' : ''}`}>
                  <div className="pm-server-lights">
                    {[serverLights.l1, serverLights.l2, serverLights.l3].map((on, i) => (
                      <div key={i} className={`pm-server-light ${on ? 'active' : ''}`} />
                    ))}
                  </div>
                </div>
                {/* Transfer path */}
                <div className="pm-transfer-path">
                  <svg>
                    <path className={`pm-path-line ${animElems.path ? 'animate' : ''}`} d="M0,0 C50,0 50,100 100,100" />
                  </svg>
                  <div className={`pm-transfer-dot ${animElems.path ? 'animate' : ''}`} />
                </div>
                {/* Success animation */}
                {(phase === 'success') && (
                  <div className={`pm-success-animation ${animElems.success ? 'animate' : ''}`}>
                    <div className="pm-success-circle">
                      <svg className="w-12 h-12 text-green-400" viewBox="0 0 24 24" fill="none">
                        <path className="pm-success-checkmark" d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                )}
                {/* Error animation */}
                {phase === 'error' && (
                  <div className="pm-success-animation animate">
                    <div className="pm-success-circle" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                      <svg className="w-12 h-12 text-red-400" viewBox="0 0 24 24" fill="none">
                        <path className="pm-error-x" d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                )}
                {/* Progress bar */}
                <div className="pm-progress-bar">
                  <div className="pm-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Stage indicators */}
              <div className="pm-stage-indicator px-4">
                {[
                  { key:'s1', icon:<CreditCard className="w-4 h-4"/>, label:'Card Info'   },
                  { key:'s2', icon:<Shield     className="w-4 h-4"/>, label:'Encryption' },
                  { key:'s3', icon:<Server     className="w-4 h-4"/>, label:'Processing' },
                  { key:'s4', icon:<CheckCircle className="w-4 h-4"/>,label:'Complete'   },
                ].map(({ key, icon, label }) => (
                  <div key={key} className={`pm-stage ${stageClass(key)}`}>
                    <div className="pm-stage-icon">{icon}</div>
                    <div className="pm-stage-text">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold mb-1">{processingMsg.title}</h3>
                <p className="text-gray-400 text-sm">{processingMsg.sub}</p>
                {phase === 'error' && (
                  <button onClick={() => { setPhase('form'); setProcessing(false); }} className="mt-5 btn-primary text-sm px-6 py-2.5">
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Payment form (visible when phase === 'form') ── */}
          {phase === 'form' && (
            <>
              {/* Order Summary */}
              <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatShortDate(event.date)} · {formatTime(event.time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Venue
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white text-right max-w-[180px] truncate">{event.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" /> Tickets
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{quantity} × {ticketType} ({formatCurrency(price)} each)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Card Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5">
                <div className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="form-label flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Card Number
                    </label>
                    <div ref={cardNumRef}
                      className="pm-stripe-field border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 min-h-[48px]" />
                  </div>

                  {/* Expiry + CVC */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Expiry Date</label>
                      <div ref={cardExpRef}
                        className="pm-stripe-field border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 min-h-[48px]" />
                    </div>
                    <div>
                      <label className="form-label">CVC</label>
                      <div ref={cardCvcRef}
                        className="pm-stripe-field border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 min-h-[48px]" />
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="form-label">ZIP / Postal Code</label>
                    <div ref={postalRef}
                      className="pm-stripe-field border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 min-h-[48px]" />
                  </div>
                </div>

                {/* Field error */}
                {fieldError && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {fieldError}
                  </div>
                )}

                {/* Pay button */}
                <button
                  type="submit"
                  disabled={!ready || processing}
                  onClick={addRipple}
                  className="relative overflow-hidden mt-5 w-full btn-primary py-4 text-base shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {!ready
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading…</span>
                    : <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Pay {formatCurrency(total)}</span>
                  }
                </button>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400 dark:text-gray-500">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secured by Stripe · 256-bit SSL encryption</span>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
