import { apiFetch } from '../utils/api';

/** Fetch all reviews for an event (public). */
export const getReviews = (eventId) =>
  apiFetch(`/reviews/${eventId}`);

/** Check if the logged-in user can review this event. */
export const checkCanReview = (eventId) =>
  apiFetch(`/reviews/${eventId}/can-review`);

/** Submit a review (requires auth token in localStorage). */
export const postReview = (eventId, { rating, comment, userName }) =>
  apiFetch(`/reviews/${eventId}`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment, userName }),
  });
