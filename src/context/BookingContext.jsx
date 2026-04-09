import React, { createContext, useState, useContext } from 'react';
import { apiFetch } from '../utils/api';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);

  const fetchUserBookings = async (userId) => {
    const data = await apiFetch(`/bookings/${userId}`);
    setBookings(data);
    return data;
  };

  const addBooking = async (booking) => {
    const saved = await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
    setBookings((prev) => [saved, ...prev]);
    return saved;
  };

  const cancelBooking = async (bookingId) => {
    const updated = await apiFetch(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    });
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? updated : b))
    );
  };

  const getUserBookings = () => bookings;

  return (
    <BookingContext.Provider value={{ bookings, fetchUserBookings, addBooking, cancelBooking, getUserBookings }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
