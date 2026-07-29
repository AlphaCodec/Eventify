import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { formatShortDate, formatTime, formatCurrency } from '../utils/helpers';
import { Calendar, MapPin, Ticket, User } from 'lucide-react';

export default function QRTicket({ booking, onClose }) {
  const canvasRef = useRef(null);
  const event = booking?.events || {};

  useEffect(() => {
    if (!canvasRef.current || !booking) return;
    const data = JSON.stringify({
      ref:   booking.booking_ref,
      event: event.title,
      user:  booking.user_id,
      qty:   booking.quantity,
      type:  booking.ticket_type,
    });
    QRCode.toCanvas(canvasRef.current, data, {
      width: 180,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    });
  }, [booking]);

  if (!booking) return null;

  const isVip = booking.ticket_type === 'vip';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 ${isVip ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider">E-Ticket</p>
              <h3 className="text-white font-display font-extrabold text-lg leading-tight mt-0.5 line-clamp-1">{event.title}</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isVip ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
              {isVip ? '⭐ VIP' : 'Standard'}
            </div>
          </div>
        </div>

        {/* Ticket body */}
        <div className="px-6 pt-5 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-y-3 text-sm mb-5">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Date</p>
              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-500" />
                {event.date ? formatShortDate(event.date) : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Time</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.time ? formatTime(event.time) : '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Venue</p>
              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                {event.location || '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Tickets</p>
              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-primary-500" />
                {booking.quantity} × {booking.ticket_type}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Total Paid</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(booking.total_price)}</p>
            </div>
          </div>

          {/* Dashed separator */}
          <div className="flex items-center gap-2 my-4">
            <div className="w-4 h-4 rounded-full bg-gray-100 -ml-8 border border-gray-200" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
            <div className="w-4 h-4 rounded-full bg-gray-100 -mr-8 border border-gray-200" />
          </div>

          {/* QR + Booking Ref */}
          <div className="flex flex-col items-center pb-6">
            <canvas ref={canvasRef} className="rounded-xl" />
            <p className="mt-3 font-mono text-sm font-bold text-gray-900 dark:text-white tracking-widest">{booking.booking_ref}</p>
            <p className="text-xs text-gray-400 mt-1">Show this QR code at the entrance</p>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="btn-outline w-full text-sm py-2.5">Close</button>
        </div>
      </div>
    </div>
  );
}
