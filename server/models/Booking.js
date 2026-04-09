import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId:      { type: String, required: true },
    eventId:     { type: String, required: true },
    eventTitle:  { type: String, required: true },
    eventDate:   { type: String },
    eventImage:  { type: String },
    ticketType:  { type: String, enum: ['standard', 'vip'], default: 'standard' },
    quantity:    { type: Number, required: true, min: 1 },
    totalPrice:  { type: Number, required: true },
    status:      { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
