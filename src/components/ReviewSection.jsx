import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Send, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReviews, checkCanReview, postReview } from '../services/reviewService';

/* ─── Star Rating ───────────────────────────────────────────── */
function StarRating({ value, onChange, readonly = false, size = 22 }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: readonly ? 'default' : 'pointer',
            transition: 'transform 0.15s',
            transform: !readonly && hovered >= star ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <Star
            size={size}
            fill={active >= star ? '#f5a623' : 'transparent'}
            color={active >= star ? '#f5a623' : 'var(--text-muted)'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────────────────── */
function ReviewAvatar({ name }) {
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const palette = [
    ['#7c5cfc', '#1c1432'], ['#f5a623', '#2a1f0a'],
    ['#34d399', '#0a2018'], ['#f472b6', '#2a0a1a'], ['#60a5fa', '#0a1428'],
  ];
  const [fg, bg] = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: bg, border: `1.5px solid ${fg}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: fg, flexShrink: 0,
      fontFamily: 'Space Grotesk, sans-serif',
    }}>
      {initials}
    </div>
  );
}

/* ─── Locked State ──────────────────────────────────────────── */
function LockedReviewForm({ reason, isLoggedIn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px 24px', marginBottom: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'rgba(124,92,252,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={22} color="var(--violet-light)" />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 6 }}>
          Reviews are for attendees only
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 340 }}>
          {isLoggedIn
            ? reason || 'You need a confirmed booking for this event to leave a review.'
            : 'Please log in and book a ticket to share your experience.'}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Already Reviewed Banner ───────────────────────────────── */
function AlreadyReviewedBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
        borderRadius: 16, padding: '18px 22px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <CheckCircle size={20} color="#34d399" />
      <p style={{ fontSize: 14, color: '#34d399', fontWeight: 500 }}>
        You've already reviewed this event — thanks for your feedback!
      </p>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function ReviewSection({ eventId, user }) {
  const [reviews,    setReviews]    = useState([]);
  const [rating,     setRating]     = useState(0);
  const [name,       setName]       = useState(user?.name || '');
  const [comment,    setComment]    = useState('');
  const [error,      setError]      = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [eligLoading, setEligLoading] = useState(true);

  const loadReviews = useCallback(() => {
    getReviews(eventId).then(setReviews).catch(() => setReviews([]));
  }, [eventId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  useEffect(() => {
    if (!user) {
      setEligibility({ eligible: false, reason: null });
      setEligLoading(false);
      return;
    }
    setEligLoading(true);
    checkCanReview(eventId)
      .then(setEligibility)
      .catch(() => setEligibility({ eligible: false, reason: 'Unable to verify eligibility.' }))
      .finally(() => setEligLoading(false));
  }, [eventId, user]);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const handleSubmit = async () => {
    if (!rating)         return setError('Please select a star rating.');
    if (!name.trim())    return setError('Please enter your name.');
    if (!comment.trim()) return setError('Please write a short review.');
    setError('');
    setSubmitting(true);
    try {
      const newReview = await postReview(eventId, { rating, comment: comment.trim(), userName: name.trim() });
      setReviews((prev) => [newReview, ...prev]);
      setRating(0);
      setComment('');
      setSubmitted(true);
      setEligibility({ eligible: false, reason: null, alreadyReviewed: true });
      setTimeout(() => setSubmitted(false), 3500);
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(124,92,252,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={16} color="var(--violet-light)" />
          </div>
          <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>
            Reviews
          </h2>
        </div>
        {avgRating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarRating value={Math.round(Number(avgRating))} readonly size={16} />
            <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
              {avgRating}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </div>

      {/* Form area */}
      {eligLoading ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 18, height: 18,
            border: '2px solid var(--surface-2)', borderTopColor: 'var(--violet)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Checking your eligibility…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : eligibility?.alreadyReviewed ? (
        <AlreadyReviewedBanner />
      ) : eligibility?.eligible ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px', marginBottom: 24,
          }}
        >
          <p style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16,
          }}>
            Write a Review
          </p>

          {/* Star picker */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Your rating</p>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>

          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ position: 'relative' }}>
              <User size={14} color="var(--text-muted)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="input-field" type="text" placeholder="Your name"
                value={name} onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 16 }}>
            <textarea
              className="input-field"
              placeholder="Share your experience at this event…"
              value={comment} onChange={(e) => setComment(e.target.value)}
              rows={3} style={{ resize: 'vertical', minHeight: 88, lineHeight: 1.6 }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 12, padding: '10px 14px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10,
            }}>
              <AlertCircle size={14} color="#f87171" />
              <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSubmit} disabled={submitting}
              className="btn-primary"
              style={{
                padding: '10px 22px', fontSize: 14, gap: 6,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: 13, height: 13,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Submitting…
                </>
              ) : (
                <><Send size={14} /> Submit Review</>
              )}
            </button>
            <AnimatePresence>
              {submitted && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 13, color: '#34d399', fontWeight: 500 }}
                >
                  ✓ Review posted!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <LockedReviewForm reason={eligibility?.reason} isLoggedIn={!!user} />
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
        }}>
          <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            No reviews yet — be the first attendee to share your experience!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence initial={false}>
            {reviews.map((review, i) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.04 }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <ReviewAvatar name={review.userName} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 6, marginBottom: 6,
                    }}>
                      <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                        {review.userName}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <StarRating value={review.rating} readonly size={14} />
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8 }}>
                      {review.comment}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
