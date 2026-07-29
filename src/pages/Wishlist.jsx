import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useEvents } from '../context/EventContext';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';

export default function Wishlist() {
  const { wishlistIds, fetchWishlist } = useWishlist();
  const { events } = useEvents();

  useEffect(() => { fetchWishlist(); }, []);

  const wishlistEvents = events.filter(e => wishlistIds.has(e.id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white">My Wishlist</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{wishlistEvents.length} saved event{wishlistEvents.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {!wishlistEvents.length ? (
          <EmptyState
            icon="❤️"
            title="Your wishlist is empty"
            description="Browse events and tap the heart icon to save them here."
            action={{ to: '/events', label: 'Explore Events' }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {wishlistEvents.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <EventCard event={e} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
