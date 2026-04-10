import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { X, Lock, CreditCard } from 'lucide-react';

// ─── Stripe publishable key ───────────────────────────────────────────────────
const stripePromise = loadStripe(
  'pk_test_51S92XhDvDhrIfBWbvoEXKZDWcG7mZ800GcHFCZ7NR7h5fqiUooKhRlTNGDNU2wksAK2KXj43a4rdqrosKRIpT5Bh00j3sBQI8X'
);

// ─── CSS injected once ───────────────────────────────────────────────────────
const ANIMATION_CSS = `
@keyframes pm-shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position:  1000px 0; }
}
@keyframes pm-pulse-ring {
  0%   { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}
@keyframes pm-slide-up {
  0%   { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0);    opacity: 1; }
}
@keyframes pm-checkmark {
  0%   { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0;   }
}
@keyframes pm-fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes pm-ripple {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
}
@keyframes pm-glow {
  0%,100% { box-shadow: 0 0 5px rgba(99,102,241,.5); }
  50%      { box-shadow: 0 0 20px rgba(99,102,241,.8),0 0 30px rgba(99,102,241,.6); }
}
@keyframes pm-data-flow {
  0%   { transform: translateX(0);     opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateX(100px); opacity: 0; }
}
@keyframes pm-secure-pulse {
  0%   { transform: scale(1);   opacity: .8; }
  50%  { transform: scale(1.2); opacity: .4; }
  100% { transform: scale(1.4); opacity: 0;  }
}
@keyframes pm-hologram {
  0%   { transform: rotate(0deg)   scale(1);   opacity: .8; }
  50%  { transform: rotate(180deg) scale(1.1); opacity: .6; }
  100% { transform: rotate(360deg) scale(1);   opacity: .8; }
}
@keyframes pm-path-draw {
  0%   { stroke-dashoffset: 300; }
  100% { stroke-dashoffset: 0;   }
}
@keyframes pm-card-insert {
  0%   { transform: translateX(-100px) rotate(-5deg); opacity: 0; }
  60%  { transform: translateX(10px)   rotate(2deg);  opacity: 1; }
  100% { transform: translateX(0)      rotate(0deg);  opacity: 1; }
}
@keyframes pm-terminal-type {
  0%   { width: 0; }
  100% { width: 100%; }
}
@keyframes pm-shield-pulse {
  0%,100% { transform: scale(1);    opacity: 1;  }
  50%      { transform: scale(1.15); opacity: .7; }
}
@keyframes pm-server-blink {
  0%,100% { opacity: 1; }
  50%      { opacity: .3; }
}
@keyframes pm-dot-travel {
  0%   { offset-distance: 0%;   opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes pm-success-burst {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}
@keyframes pm-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pm-shimmer {
  background: linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
  background-size: 1000px 100%;
  animation: pm-shimmer 2s infinite;
}
.pm-stage-dot {
  width:12px; height:12px; border-radius:50%; background:#4b5563;
  transition: background .3s;
}
.pm-stage-dot.active  { background: #6366f1; animation: pm-glow 1s infinite; }
.pm-stage-dot.done    { background: #10b981; }
.pm-card-anim {
  position:absolute; top:50px; left:50px;
  width:120px; height:75px;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  border-radius:10px; box-shadow:0 10px 20px rgba(0,0,0,.2);
  display:flex; align-items:center; justify-content:center;
  color:white; font-weight:bold; z-index:10;
  opacity:0; transform:translateX(-100px) rotate(-5deg);
}
.pm-card-anim.run { animation: pm-card-insert 1s forwards; }
.pm-terminal-line {
  overflow:hidden; white-space:nowrap; width:0;
}
.pm-terminal-line.run { animation: pm-terminal-type 2s steps(30) forwards; }
.pm-shield {
  animation: pm-shield-pulse 1.5s ease-in-out infinite;
}
.pm-server-light {
  width:8px; height:8px; border-radius:50%; background:#4b5563;
  transition: background .3s;
}
.pm-server-light.on { background:#10b981; animation: pm-server-blink .5s infinite; }
.pm-transfer-dot {
  width:10px; height:10px; border-radius:50%; background:#6366f1;
  offset-path: path("M 40 150 Q 200 50 360 150");
  opacity:0;
}
.pm-transfer-dot.run { animation: pm-dot-travel 2s ease-in-out forwards; }
.pm-success-ring {
  position:absolute; inset:0; border-radius:50%;
  border:4px solid #10b981; opacity:0;
}
.pm-success-ring.run { animation: pm-success-burst 1s forwards; }
.pm-input-wrap {
  border:1.5px solid #374151; border-radius:10px; padding:12px 14px;
  background:#1e293b; transition:border-color .25s, box-shadow .25s;
}
.pm-input-wrap:focus-within {
  border-color:#6366f1;
  box-shadow:0 0 0 3px rgba(99,102,241,.25);
}
.pm-pay-btn {
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  transition: opacity .2s, transform .1s;
}
.pm-pay-btn:hover:not(:disabled) { opacity:.9; }
.pm-pay-btn:active:not(:disabled) { transform:scale(.98); }
.pm-pay-btn:disabled { opacity:.55; cursor:not-allowed; }
`;

// ─── Stripe element style ────────────────────────────────────────────────────
const STRIPE_STYLE = {
  base: {
    color: '#f1f5f9',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '15px',
    '::placeholder': { color: '#64748b' },
  },
  invalid: { color: '#f87171' },
};

// ─── Processing Overlay ──────────────────────────────────────────────────────
function ProcessingOverlay({ phase }) {
  // phase: 'idle' | 'processing' | 'success' | 'error'
  const cardRef  = useRef(null);
  const termRef  = useRef(null);
  const dotRef   = useRef(null);
  const [lights, setLights] = useState([false, false, false]);
  const [stages, setStages] = useState([false, false, false, false]); // active flags
  const [done,   setDone  ] = useState([false, false, false, false]); // completed flags
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== 'processing') {
      setStages([false,false,false,false]);
      setDone([false,false,false,false]);
      setLights([false,false,false]);
      setProgress(0);
      if (cardRef.current)  cardRef.current.classList.remove('run');
      if (termRef.current)  termRef.current.classList.remove('run');
      if (dotRef.current)   dotRef.current.classList.remove('run');
      return;
    }

    setProgress(5);
    const t = [];
    t.push(setTimeout(() => {
      setStages([true,false,false,false]);
      setProgress(25);
      if (cardRef.current) { cardRef.current.classList.remove('run'); void cardRef.current.offsetWidth; cardRef.current.classList.add('run'); }
    }, 300));
    t.push(setTimeout(() => {
      setStages([false,true,false,false]);
      setDone([true,false,false,false]);
      setProgress(45);
      if (termRef.current) { termRef.current.classList.remove('run'); void termRef.current.offsetWidth; termRef.current.classList.add('run'); }
    }, 1600));
    t.push(setTimeout(() => {
      setStages([false,false,true,false]);
      setDone([true,true,false,false]);
      setProgress(65);
    }, 3200));
    t.push(setTimeout(() => {
      setStages([false,false,false,true]);
      setDone([true,true,true,false]);
      setProgress(82);
      if (dotRef.current) { dotRef.current.classList.remove('run'); void dotRef.current.offsetWidth; dotRef.current.classList.add('run'); }
    }, 4800));
    t.push(setTimeout(() => setLights(l => [true, l[1], l[2]]), 5200));
    t.push(setTimeout(() => setLights(l => [l[0], true, l[2]]), 5700));
    t.push(setTimeout(() => setLights(l => [l[0], l[1], true]), 6200));
    return () => t.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase === 'success') setProgress(100);
  }, [phase]);

  const visible = phase !== 'idle';

  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:9999,
        backdropFilter:'blur(10px)',
        backgroundColor:'rgba(15,23,42,.92)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        transition:'opacity .4s',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      {/* ── Animation canvas ── */}
      <div style={{ width:400, height:240, position:'relative', marginBottom:24 }}>
        {/* Card */}
        <div ref={cardRef} className="pm-card-anim">
          <CreditCard size={32} />
        </div>

        {/* Terminal */}
        <div style={{
          position:'absolute', top:50, right:30,
          width:140, background:'#0f172a',
          border:'1px solid #374151', borderRadius:8, padding:'10px 12px',
          fontFamily:'monospace', fontSize:11, color:'#4ade80',
        }}>
          <div style={{ marginBottom:4, color:'#94a3b8' }}>▶ Stripe Terminal</div>
          <div ref={termRef} className="pm-terminal-line" style={{ color:'#4ade80' }}>
            Verifying card data...
          </div>
          <div style={{ marginTop:4, color:'#6366f1' }}>{ phase==='success' ? '✓ Authorized' : '...' }</div>
        </div>

        {/* Shield */}
        {stages[2] && (
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            fontSize:48, userSelect:'none',
          }} className="pm-shield">🔐</div>
        )}

        {/* Transfer SVG */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
          {stages[3] && (
            <>
              <path
                d="M 40 150 Q 200 50 360 150"
                fill="none" stroke="#6366f1" strokeWidth="2"
                strokeDasharray="300" strokeDashoffset="0"
                style={{ animation:'pm-path-draw 1.5s ease forwards' }}
              />
              <foreignObject x="0" y="0" width="400" height="240">
                <div xmlns="http://www.w3.org/1999/xhtml"
                  ref={dotRef}
                  className="pm-transfer-dot"
                  style={{ position:'absolute', top:0, left:0 }}
                />
              </foreignObject>
            </>
          )}
        </svg>

        {/* Bank server */}
        {stages[3] && (
          <div style={{
            position:'absolute', bottom:10, right:20,
            background:'#1e293b', border:'1px solid #374151',
            borderRadius:8, padding:'8px 12px',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ fontSize:20 }}>🏦</span>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {lights.map((on, i) => (
                <div key={i} className={`pm-server-light ${on ? 'on' : ''}`} />
              ))}
            </div>
          </div>
        )}

        {/* Success burst */}
        {phase === 'success' && (
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:80, height:80 }}>
            <div style={{ position:'relative', width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div className="pm-success-ring run" />
              <span style={{ fontSize:36, position:'relative', zIndex:1 }}>✅</span>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:40 }}>
            ❌
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ width:340, height:6, background:'#1e293b', borderRadius:999, marginBottom:20, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:999,
          background:'linear-gradient(90deg,#6366f1,#8b5cf6)',
          width:`${progress}%`, transition:'width .8s ease',
        }} />
      </div>

      {/* ── Stage indicators ── */}
      <div style={{ display:'flex', gap:16, marginBottom:20 }}>
        {['Card Read','Verify','Encrypt','Transfer'].map((label, i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <div className={`pm-stage-dot ${stages[i] ? 'active' : ''} ${done[i] ? 'done' : ''}`}
              style={{ margin:'0 auto 4px' }} />
            <div style={{ fontSize:10, color:'#94a3b8' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Status text ── */}
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'#f1f5f9', fontWeight:600, fontSize:18, marginBottom:6 }}>
          {phase === 'processing' && 'Processing your payment…'}
          {phase === 'success'    && 'Payment Successful! 🎉'}
          {phase === 'error'      && 'Payment Failed'}
        </div>
        <div style={{ color:'#94a3b8', fontSize:13 }}>
          {phase === 'processing' && 'Securely authorizing with Stripe'}
          {phase === 'success'    && 'Your tickets are confirmed'}
          {phase === 'error'      && 'Please check your card details and try again'}
        </div>
      </div>
    </div>
  );
}

// ─── Inner form (needs Stripe context) ──────────────────────────────────────
function CheckoutForm({ event, ticketType, quantity, totalPrice, onSuccess, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();

  const [phase,    setPhase   ] = useState('idle'); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [name,     setName    ] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErrorMsg('');
    setPhase('processing');

    try {
      // 1. Ask our backend for a PaymentIntent
      const res = await fetch('https://event-serv.onrender.com/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(totalPrice * 100), currency: 'usd' }),
      });

      if (!res.ok) throw new Error('Could not reach payment server');
      const { clientSecret } = await res.json();

      // 2. Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: { name },
        },
      });

      if (error) throw error;
      if (paymentIntent.status !== 'succeeded') throw new Error('Payment did not complete.');

      setPhase('success');
      setTimeout(() => onSuccess(paymentIntent.id), 2200);

    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Payment failed. Please try again.');
      setTimeout(() => setPhase('idle'), 2500);
    }
  };

  return (
    <>
      {/* Overlay is rendered at document level so it covers the modal too */}
      <ProcessingOverlay phase={phase} />

      <div style={{
        background:'#0f172a', borderRadius:16, padding:'28px 32px', width:'100%', maxWidth:480,
        color:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif',
        boxShadow:'0 25px 60px rgba(0,0,0,.5)',
        position:'relative',
      }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:2, letterSpacing:1, textTransform:'uppercase' }}>
              Secure Checkout
            </div>
            <div style={{ fontWeight:700, fontSize:18 }}>{event.title}</div>
          </div>
          <button
            onClick={onCancel}
            style={{ background:'#1e293b', border:'none', borderRadius:8, padding:'6px 10px', color:'#94a3b8', cursor:'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Order summary */}
        <div style={{
          background:'#1e293b', borderRadius:10, padding:'14px 16px', marginBottom:24,
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <div style={{ fontSize:13, color:'#94a3b8' }}>
            {quantity} × {ticketType.toUpperCase()} ticket{quantity > 1 ? 's' : ''}
          </div>
          <div style={{ fontWeight:700, fontSize:22, color:'#818cf8' }}>
            ${totalPrice.toFixed(2)}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize:12, color:'#94a3b8', display:'block', marginBottom:6 }}>Cardholder Name</label>
            <div className="pm-input-wrap">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                required
                style={{
                  width:'100%', background:'transparent', border:'none', outline:'none',
                  color:'#f1f5f9', fontSize:15,
                }}
              />
            </div>
          </div>

          {/* Card number */}
          <div>
            <label style={{ fontSize:12, color:'#94a3b8', display:'block', marginBottom:6 }}>Card Number</label>
            <div className="pm-input-wrap">
              <CardNumberElement options={{ style: STRIPE_STYLE, showIcon: true }} />
            </div>
          </div>

          {/* Expiry + CVC */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:12, color:'#94a3b8', display:'block', marginBottom:6 }}>Expiry</label>
              <div className="pm-input-wrap">
                <CardExpiryElement options={{ style: STRIPE_STYLE }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#94a3b8', display:'block', marginBottom:6 }}>CVC</label>
              <div className="pm-input-wrap">
                <CardCvcElement options={{ style: STRIPE_STYLE }} />
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{
              background:'#450a0a', border:'1px solid #991b1b',
              borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:13,
              animation:'pm-slide-up .3s',
            }}>
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!stripe || phase === 'processing'}
            className="pm-pay-btn"
            style={{
              border:'none', borderRadius:10, padding:'14px',
              color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              marginTop:4,
            }}
          >
            {phase === 'processing' ? (
              <>
                <span style={{
                  width:18, height:18, border:'2px solid rgba(255,255,255,.4)',
                  borderTopColor:'#fff', borderRadius:'50%',
                  animation:'pm-spin .8s linear infinite', display:'inline-block',
                }} />
                Processing…
              </>
            ) : (
              <>
                <Lock size={16} />
                Pay ${totalPrice.toFixed(2)} Securely
              </>
            )}
          </button>

          {/* Trust badges */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#475569', fontSize:11 }}>
            <Lock size={12} />
            <span>256-bit SSL encryption</span>
            <span>·</span>
            <span>Powered by Stripe</span>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Public wrapper ──────────────────────────────────────────────────────────
export default function PaymentModal({ event, ticketType, quantity, totalPrice, onSuccess, onClose }) {
  // Inject CSS once
  useEffect(() => {
    if (document.getElementById('pm-styles')) return;
    const el = document.createElement('style');
    el.id = 'pm-styles';
    el.textContent = ANIMATION_CSS;
    document.head.appendChild(el);
  }, []);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)',
      padding:'20px',
    }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Elements stripe={stripePromise}>
        <CheckoutForm
          event={event}
          ticketType={ticketType}
          quantity={quantity}
          totalPrice={totalPrice}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </Elements>
    </div>
  );
}
