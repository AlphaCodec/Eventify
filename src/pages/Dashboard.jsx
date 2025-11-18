import React from 'react';
import { Calendar, Ticket, Heart, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { eventsData } from '../data/eventsData';
import Swal from 'sweetalert2';

function Dashboard() {
  const { user } = useAuth();
  const { getUserBookings, cancelBooking } = useBooking();
  const userBookings = getUserBookings(user?.id);

  const handleCancelBooking = (bookingId) => {
    Swal.fire({
      title: "Cancel Booking?",
      text: "Are you sure you want to cancel this booking?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel it"
    }).then((result) => {
      if (result.isConfirmed) {
        cancelBooking(bookingId);
        Swal.fire({
          title: "Cancelled!",
          text: "Your booking has been cancelled.",
          icon: "success",
          confirmButtonColor: "#0ea5e9"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <img src={user?.avatar} alt={user?.name} className="h-20 w-20 rounded-full border-4 border-white" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-primary-100">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-neutral-900">{userBookings.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Ticket className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-accent-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Active Events</p>
                <p className="text-3xl font-bold text-neutral-900">{userBookings.filter(b => b.status === 'confirmed').length}</p>
              </div>
              <div className="bg-accent-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-accent-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Saved Events</p>
                <p className="text-3xl font-bold text-neutral-900">0</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Heart className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-accent-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Profile Views</p>
                <p className="text-3xl font-bold text-neutral-900">156</p>
              </div>
              <div className="bg-accent-100 p-3 rounded-lg">
                <Settings className="h-6 w-6 text-accent-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">My Bookings</h2>

          {userBookings.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No bookings yet</h3>
              <p className="text-neutral-600 mb-6">Start exploring events and make your first booking!</p>
              <a href="/events" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold">
                Browse Events
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {userBookings.map((booking) => {
                const event = eventsData.find(e => e.id === booking.eventId);
                return (
                  <div key={booking.id} className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <img src={event?.image} alt={event?.title} className="w-24 h-24 rounded-lg object-cover" />
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 mb-2">{booking.eventTitle}</h3>
                          <div className="space-y-1 text-sm text-neutral-600">
                            <p><span className="font-semibold">Date:</span> {new Date(booking.eventDate).toLocaleDateString()}</p>
                            <p><span className="font-semibold">Tickets:</span> {booking.quantity} x {booking.ticketType.toUpperCase()}</p>
                            <p><span className="font-semibold">Total:</span> ${booking.totalPrice.toFixed(2)}</p>
                            <p><span className="font-semibold">Booked on:</span> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                        </span>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-semibold"
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
