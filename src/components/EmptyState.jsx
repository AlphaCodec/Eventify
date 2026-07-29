import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({ emoji, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-5">{emoji}</div>
      <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      {description && <p className="text-gray-500 dark:text-gray-400 mb-7 max-w-sm">{description}</p>}
      {action && (
        <Link to={action.to} className="btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}
