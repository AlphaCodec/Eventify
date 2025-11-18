import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

function EventCard({ event }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative overflow-hidden h-48">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {event.featured && (
          <div className="absolute top-4 right-4 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
          <span className="text-xs font-semibold text-neutral-900">{event.category}</span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-3 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Calendar className="h-4 w-4 text-primary-600" />
            <span>{formatDate(event.date)} • {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 text-primary-600" />
            <span>{event.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Users className="h-4 w-4 text-primary-600" />
            <span>{event.attendees} attending</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-600" />
            <span className="text-lg font-bold text-neutral-900">${event.price}</span>
            <span className="text-sm text-neutral-500">/ ticket</span>
          </div>
          <Link 
            to={`/events/${event.id}`}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default EventCard;
