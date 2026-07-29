import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, Star, BarChart2, ArrowRight } from 'lucide-react';

export default function FirstEventModal({ eventTitle, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Confetti header */}
        <div className="bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 p-8 text-center relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 translate-y-10" />

          {/* Animated star burst */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
            className="relative z-10"
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="relative z-10"
          >
            <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">🎉 Congratulations!</p>
            <h2 className="font-display text-2xl font-extrabold text-white leading-tight">
              You just hosted your first event!
            </h2>
            {eventTitle && (
              <p className="text-white/75 text-sm mt-2 line-clamp-1">"{eventTitle}"</p>
            )}
          </motion.div>
        </div>

        {/* Body */}
        <div className="p-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
            className="text-gray-600 dark:text-gray-400 text-sm text-center leading-relaxed mb-6"
          >
            Your Organiser Dashboard is now active. Track ticket sales, revenue, attendee fill rates, and booking activity — all in one place.
          </motion.p>

          {/* Features unlocked */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            className="space-y-3 mb-6"
          >
            {[
              { icon: BarChart2,  color: 'text-primary-500 bg-primary-50 dark:bg-primary-900/30', text: 'Live booking activity sparkline per event' },
              { icon: TrendingUp, color: 'text-green-500 bg-green-50 dark:bg-green-900/30',       text: 'Revenue, ticket sales & fill rate at a glance' },
              { icon: Users,      color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',          text: 'Standard vs VIP ticket breakdown' },
              { icon: Star,       color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',       text: 'Overall organiser performance summary' },
            ].map(({ icon: Icon, color, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.48 + i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-3"
          >
            <button
              onClick={onClose}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 shadow-glow"
            >
              View My Insights <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3"
          >
            Find it in Dashboard → Insights anytime
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
