import React, { useState, useEffect } from 'react';
import { Star, Trash2, Edit2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEventReviews, submitReview, deleteReview, getAverageRating } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import toast from 'react-hot-toast';
import { formatShortDate } from '../utils/helpers';

function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const s = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" disabled={readonly}
          onClick={() => !readonly && onChange?.(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}>
          <Star className={`${s} ${i<=(hover||value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-600 fill-gray-200 dark:fill-gray-600'} transition-colors`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ eventId }) {
  const { user, isAdmin }   = useAuth();
  const { hasBooking }      = useBookings();
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [rating, setRating]     = useState(5);
  const [comment, setComment]   = useState('');
  const [submitting, setSub]    = useState(false);
  const [editMode, setEdit]     = useState(false);

  const myReview = reviews.find(r => r.user_id === user?.id);
  const canReview = user && hasBooking(user.id, eventId) && !myReview;
  const avg = getAverageRating(reviews);

  useEffect(() => { getEventReviews(eventId).then(d => { setReviews(d); setLoading(false); }); }, [eventId]);
  useEffect(() => { if (myReview && editMode) { setRating(myReview.rating); setComment(myReview.comment||''); } }, [myReview, editMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating.'); return; }
    setSub(true);
    try {
      const review = await submitReview(eventId, user.id, { rating, comment });
      if (editMode) setReviews(prev => prev.map(r => r.user_id===user.id ? review : r));
      else setReviews(prev => [review, ...prev]);
      setComment(''); setRating(5); setEdit(false);
      toast.success(editMode ? 'Review updated!' : 'Review submitted!');
    } catch (err) { toast.error(err.message); }
    setSub(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    await deleteReview(id);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success('Review deleted.');
  };

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />;

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{avg.toFixed(1)}</p>
          <StarRating value={Math.round(avg)} readonly size="sm" />
          <p className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length!==1?'s':''}</p>
        </div>
        <div className="flex-1">
          {[5,4,3,2,1].map(star => {
            const cnt = reviews.filter(r=>r.rating===star).length;
            const pct = reviews.length ? (cnt/reviews.length)*100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-3">{star}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width:`${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-5">{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write / Edit Review */}
      {(canReview || (myReview && editMode)) && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 border border-primary-100 dark:border-primary-900/50">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{editMode?'Edit your review':'Write a review'}</h4>
          <StarRating value={rating} onChange={setRating} />
          <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share your experience… (optional)" rows={3} className="input-field mt-3 resize-none text-sm" />
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={submitting} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />{submitting?'Submitting…':editMode?'Update':'Submit'}
            </button>
            {editMode && <button type="button" onClick={()=>setEdit(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>}
          </div>
        </form>
      )}

      {!user && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          <a href="/login" className="text-primary-600 dark:text-primary-400 font-semibold">Sign in</a> and book this event to leave a review.
        </p>
      )}

      {/* Review list */}
      <div className="space-y-4">
        <AnimatePresence>
          {reviews.map(r => (
            <motion.div key={r.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex gap-3">
              <img src={r.profiles?.avatar_url||`https://ui-avatars.com/api/?name=${r.profiles?.name}&background=6366f1&color=fff&size=80`}
                alt={r.profiles?.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{r.profiles?.name||'User'}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatShortDate(r.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} readonly size="sm" />
                    {(r.user_id===user?.id||isAdmin) && (
                      <div className="flex gap-1">
                        {r.user_id===user?.id && !editMode && (
                          <button onClick={()=>setEdit(true)} className="p-1 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={()=>handleDelete(r.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.comment}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!reviews.length && <p className="text-sm text-gray-400 text-center py-6">No reviews yet. Be the first!</p>}
      </div>
    </div>
  );
}
