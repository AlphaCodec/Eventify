import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Clock, Star, Share2, Heart } from 'lucide-react';
import { eventsData } from '../data/eventsData';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBooking } = useBooking();
  const event = eventsData.find(e => e.id === parseInt(id));
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [ticketType, setTicketType] = useState('standard');

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Event Not Found</h2>
          <button onClick={() => navigate('/events')} className="text-primary-600 hover:text-primary-700">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const handleBooking = () => {
    if (!user) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please login to book tickets",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0ea5e9",
        confirmButtonText: "Login",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }

    const price = ticketType === 'vip' ? event.priceVip : event.price;
    const totalPrice = price * ticketQuantity;

    addBooking({
      userId: user.id,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      ticketType: ticketType,
      quantity: ticketQuantity,
      totalPrice: totalPrice
    });

    Swal.fire({
      title: "Booking Successful!",
      html: `
        <p>Your tickets have been booked successfully.</p>
        <div class="mt-4 p-4 bg-neutral-50 rounded-lg">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Tickets:</strong> ${ticketQuantity} x ${ticketType.toUpperCase()}</p>
          <p><strong>Total:</strong> $${totalPrice.toFixed(2)}</p>
        </div>
      `,
      icon: "success",
      confirmButtonColor: "#0ea5e9"
    }).then(() => {
      navigate('/dashboard');
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-96 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-white text-neutral-900 px-4 py-1 rounded-full text-sm font-semibold">
                  {event.category}
                </span>
                {event.featured && (
                  <span className="bg-accent-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{event.title}</h1>
              <p className="text-lg text-white/90">By {event.organizer}</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">About This Event</h2>
              <p className="text-neutral-600 leading-relaxed">{event.description}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Event Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                  <Calendar className="h-6 w-6 text-primary-600 mt-1" />
                  <div>
                    <p className="font-semibold text-neutral-900">Date & Time</p>
                    <p className="text-neutral-600">{formatDate(event.date)}</p>
                    <p className="text-neutral-600">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                  <MapPin className="h-6 w-6 text-primary-600 mt-1" />
                  <div>
                    <p className="font-semibold text-neutral-900">Location</p>
                    <p className="text-neutral-600">{event.location}</p>
                    <p className="text-neutral-600">{event.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                  <Users className="h-6 w-6 text-primary-600 mt-1" />
                  <div>
                    <p className="font-semibold text-neutral-900">Attendees</p>
                    <p className="text-neutral-600">{event.attendees} people attending</p>
                    <p className="text-neutral-600">{event.capacity} total capacity</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                  <Star className="h-6 w-6 text-primary-600 mt-1" />
                  <div>
                    <p className="font-semibold text-neutral-900">Rating</p>
                    <p className="text-neutral-600">4.8 out of 5</p>
                    <p className="text-neutral-600">Based on 234 reviews</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span key={index} className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">Book Tickets</h3>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Ticket Type
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-primary-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ticketType"
                          value="standard"
                          checked={ticketType === 'standard'}
                          onChange={(e) => setTicketType(e.target.value)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="font-medium">Standard</span>
                      </div>
                      <span className="font-bold text-primary-600">${event.price}</span>
                    </label>

                    <label className="flex items-center justify-between p-4 border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-primary-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ticketType"
                          value="vip"
                          checked={ticketType === 'vip'}
                          onChange={(e) => setTicketType(e.target.value)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="font-medium">VIP</span>
                      </div>
                      <span className="font-bold text-primary-600">${event.priceVip}</span>
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Number of Tickets
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                      className="w-10 h-10 rounded-lg border-2 border-neutral-300 hover:border-primary-600 font-semibold"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold text-neutral-900 w-12 text-center">
                      {ticketQuantity}
                    </span>
                    <button
                      onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                      className="w-10 h-10 rounded-lg border-2 border-neutral-300 hover:border-primary-600 font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-600">Price per ticket</span>
                    <span className="font-semibold">${ticketType === 'vip' ? event.priceVip : event.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-neutral-600">Quantity</span>
                    <span className="font-semibold">{ticketQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold text-neutral-900">Total</span>
                    <span className="font-bold text-primary-600">
                      ${((ticketType === 'vip' ? event.priceVip : event.price) * ticketQuantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Book Now
                </button>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 border-2 border-neutral-200 py-3 rounded-xl hover:border-primary-600 transition-colors flex items-center justify-center gap-2">
                    <Heart className="h-5 w-5" />
                    <span className="font-medium">Save</span>
                  </button>
                  <button className="flex-1 border-2 border-neutral-200 py-3 rounded-xl hover:border-primary-600 transition-colors flex items-center justify-center gap-2">
                    <Share2 className="h-5 w-5" />
                    <span className="font-medium">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
