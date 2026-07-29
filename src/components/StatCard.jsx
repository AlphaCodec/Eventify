import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: 'border-primary-500 bg-primary-50 text-primary-600',
    accent:  'border-accent-500  bg-accent-50  text-accent-600',
    green:   'border-green-500   bg-green-50   text-green-600',
    amber:   'border-amber-500   bg-amber-50   text-amber-600',
    yellow:  'border-yellow-500  bg-yellow-50  text-yellow-600',
    red:     'border-red-500     bg-red-50     text-red-600',
    blue:    'border-blue-500    bg-blue-50    text-blue-600',
    purple:  'border-purple-500  bg-purple-50  text-purple-600',
  };

  // Fall back to primary if an unknown color is passed — prevents .split() crash
  const classes = (colorMap[color] || colorMap.primary).split(' ');
  const borderClass = classes[0];
  const iconClasses = classes.slice(1).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`stat-card ${borderClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-3xl font-display font-extrabold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconClasses}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}
