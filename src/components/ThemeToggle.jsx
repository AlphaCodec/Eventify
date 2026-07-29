import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const OPTIONS = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

// Dropdown rendered via portal so overflow-hidden on parent cards never clips it
function DropdownPortal({ anchorRef, open, onClose, mode, setTheme }) {
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({
      top:   rect.bottom + window.scrollY + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        style={{ position: 'absolute', top: coords.top, right: coords.right }}
        className="z-[9999] w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        {OPTIONS.map(opt => {
          const OptIcon = opt.icon;
          const active  = mode === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => { setTheme(opt.value); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${active
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 font-medium'
                }`}
            >
              <OptIcon className="w-4 h-4 flex-shrink-0" />
              {opt.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />}
            </button>
          );
        })}
      </motion.div>
    </>,
    document.body
  );
}

export default function ThemeToggle({ compact = false }) {
  const { mode, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  const current = OPTIONS.find(o => o.value === mode) || OPTIONS[2];
  const Icon = current.icon;

  // Compact: single cycling icon button (used in Navbar)
  if (compact) {
    const cycle = () => {
      const idx = OPTIONS.findIndex(o => o.value === mode);
      setTheme(OPTIONS[(idx + 1) % OPTIONS.length].value);
    };
    return (
      <button
        onClick={cycle}
        title={`Theme: ${current.label} — click to switch`}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400
                   hover:text-primary-500 dark:hover:text-primary-400
                   hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <motion.div
          key={mode}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0,   opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </button>
    );
  }

  // Full mode: button + portal dropdown (no overflow clipping ever)
  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl
                   border-2 border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800
                   text-sm font-semibold text-gray-700 dark:text-gray-200
                   hover:border-primary-400 dark:hover:border-primary-500
                   transition-colors select-none"
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{current.label}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <DropdownPortal
            anchorRef={btnRef}
            open={open}
            onClose={() => setOpen(false)}
            mode={mode}
            setTheme={setTheme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
