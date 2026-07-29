import { supabase } from '../lib/supabase';

export async function getEventReviews(eventId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles!user_id(name, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function submitReview(eventId, userId, { rating, comment }) {
  const { data, error } = await supabase
    .from('reviews')
    .upsert({ event_id: eventId, user_id: userId, rating, comment }, { onConflict: 'event_id,user_id' })
    .select('*, profiles!user_id(name, avatar_url)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReview(reviewId) {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export function getAverageRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
