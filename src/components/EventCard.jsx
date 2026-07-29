import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Heart, Star, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { formatShortDate, formatCurrency, capacityPercent, spotsLeft } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  Music:      'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  Technology: 'bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300',
  Food:       'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  Sports:     'bg-green-100  dark:bg-green-900/40  text-green-700  dark:text-green-300',
  Arts:       'bg-pink-100   dark:bg-pink-900/40   text-pink-700   dark:text-pink-300',
  Business:   'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  Health:     'bg-teal-100   dark:bg-teal-900/40   text-teal-700   dark:text-teal-300',
  Education:  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  Travel:     'bg-sky-100    dark:bg-sky-900/40    text-sky-700    dark:text-sky-300',
};

export default function EventCard({ event, className = '' }) {
  const { user }                         = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const now        = new Date();
  const eventDate  = new Date(event.date);
  const isPast     = eventDate < now;
  const isToday    = eventDate.toDateString() === now.toDateString();
  const daysUntil  = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
  const isSoon     = !isPast && daysUntil <= 7;

  const pct        = capacityPercent(event.attendees||0, event.capacity||1);
  const spots      = spotsLeft(event.attendees||0, event.capacity||1);
  const isFull     = spots === 0;
  const wishlisted = user ? isWishlisted(event.id) : false;
  const catColor   = CATEGORY_COLORS[event.category] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  const imageUrl   = event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop';

  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('Sign in to save events.'); return; }
    const added = await toggleWishlist(event.id);
    toast.success(added ? '❤️ Saved to wishlist!' : 'Removed from wishlist.');
  };

  return (
    <motion.div
      className={`card overflow-hidden group flex flex-col h-full ${isPast ? 'opacity-75' : ''} ${className}`}
      whileHover={{ y: isPast ? 0 : -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <Link to={`/events/${event.id}`}>
          <img
            src={imageUrl}
            alt={event.title}
            className={`w-full h-48 object-cover transition-transform duration-500 ${isPast ? 'grayscale-[40%]' : 'group-hover:scale-105'}`}
            loading="lazy"
          />
        </Link>

        {/* Overlay badges — stacked priority: past > sold out > featured > soon */}
        {isPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-gray-700/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Event Completed
            </span>
          </div>
        )}
        {!isPast && isFull && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
          </div>
        )}
        {/* Top-left badges in a row — no overlap */}
        {!isPast && !isFull && (event.featured || isSoon) && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {event.featured && (
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" /> Featured
              </span>
            )}
            {isSoon && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isToday ? 'Today!' : `${daysUntil}d left`}
              </span>
            )}
          </div>
        )}

        {/* Wishlist heart — hidden for past events */}
        {!isPast && (
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            <Heart className={`w-4 h-4 transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
          </button>
        )}

        {/* Category pill */}
        <div className={`absolute bottom-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full ${catColor} ${isPast ? 'opacity-70' : ''}`}>
          {event.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/events/${event.id}`}>
          <h3 className={`font-display font-bold text-base leading-snug mb-3 line-clamp-2 transition-colors ${
            isPast
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
          }`}>
            {event.title}
          </h3>
        </Link>

        <div className="space-y-1.5 mb-4 flex-1">
          {[
            { icon: Calendar, text: formatShortDate(event.date) },
            { icon: MapPin,   text: `${event.city}${event.location ? `, ${event.location}` : ''}` },
            { icon: Users,    text: `${(event.attendees||0).toLocaleString()} / ${(event.capacity||0).toLocaleString()}` },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span className="truncate">{text}</span>
            </div>
          ))}
        </div>

        {/* Capacity bar — show as filled/grey for past */}
        {!isPast && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{pct}% filled</span>
              <span>{spots > 0 ? `${spots} left` : 'Sold out'}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct>=90?'bg-red-400':pct>=70?'bg-yellow-400':'bg-green-400'}`} style={{width:`${pct}%`}} />
            </div>
          </div>
        )}

        {isPast ? (
          /* Past event footer */
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">This event has ended</span>
            <Link to={`/events/${event.id}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              View details
            </Link>
          </div>
        ) : (
          /* Normal footer */
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">From</p>
              <p className="font-extrabold text-primary-600 dark:text-primary-400 text-lg">{formatCurrency(event.price)}</p>
            </div>
            <Link to={`/events/${event.id}`}
              className={`btn-primary text-sm px-4 py-2 ${isFull ? 'opacity-50 pointer-events-none' : ''}`}>
              {isFull ? 'Sold Out' : 'View Event'}
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
