import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';

/**
 * GET /api/reviews/:eventId
 * Public — returns all reviews for an event.
 */
export async function getReviews(req, res) {
  try {
    const reviews = await Review.find({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/reviews/:eventId
 * Protected (requireAuth) — posts a review.
 *
 * Business rules:
 *  1. The event must exist.
 *  2. The event date must be in the past (you can't review a future event).
 *  3. The user must have at least one confirmed booking for this event.
 *  4. The user may only post one review per event.
 */
export async function postReview(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Rule 1 — event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Rule 2 — event has passed
    if (new Date(event.date) > new Date()) {
      return res.status(400).json({
        message: 'Reviews can only be submitted after the event has taken place.',
      });
    }

    // Rule 3 — must have a confirmed booking
    const booking = await Booking.findOne({ userId, eventId, status: 'confirmed' });
    if (!booking) {
      return res.status(403).json({
        message: 'Only attendees with a confirmed booking can review this event.',
      });
    }

    // Rule 4 — one review per user per event
    const duplicate = await Review.findOne({ eventId, userId });
    if (duplicate) {
      return res.status(409).json({ message: 'You have already reviewed this event.' });
    }

    const { rating, comment, userName } = req.body;

    if (!rating || !comment || !userName) {
      return res.status(400).json({ message: 'Rating, comment, and name are required.' });
    }

    const review = await Review.create({ eventId, userId, userName, rating, comment });
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/reviews/:eventId/can-review
 * Protected — tells the client whether the authenticated user is
 * eligible to submit a review (used to show/hide the form).
 */
export async function canReview(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ eligible: false, reason: 'Event not found.' });

    if (new Date(event.date) > new Date()) {
      return res.json({ eligible: false, reason: 'Event has not taken place yet.' });
    }

    const booking = await Booking.findOne({ userId, eventId, status: 'confirmed' });
    if (!booking) {
      return res.json({ eligible: false, reason: 'No confirmed booking found for this event.' });
    }

    const already = await Review.findOne({ eventId, userId });
    if (already) {
      return res.json({ eligible: false, reason: 'You have already reviewed this event.', alreadyReviewed: true });
    }

    res.json({ eligible: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
