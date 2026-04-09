import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    category:    { type: String, required: true },
    date:        { type: String, required: true },
    time:        { type: String, required: true },
    location:    { type: String, required: true },
    city:        { type: String, required: true },
    image:       { type: String, default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800' },
    price:       { type: Number, required: true },
    priceVip:    { type: Number, default: 0 },
    organizer:   { type: String, default: 'Eventify Organizer' },
    description: { type: String, required: true },
    capacity:    { type: Number, required: true },
    attendees:   { type: Number, default: 0 },
    tags:        { type: [String], default: [] },
    featured:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
