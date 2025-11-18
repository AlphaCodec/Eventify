import React, { createContext, useState, useContext } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);

  const addBooking = (booking) => {
    const newBooking = {
      id: Date.now(),
      ...booking,
      bookingDate: new Date().toISOString(),
      status: "confirmed"
    };
    setBookings(prev => [...prev, newBooking]);
    return newBooking;
  };

  const cancelBooking = (bookingId) => {
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: "cancelled" } : b
    ));
  };

  const getUserBookings = (userId) => {
    return bookings.filter(b => b.userId === userId);
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, cancelBooking, getUserBookings }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
}
