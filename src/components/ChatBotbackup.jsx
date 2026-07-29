import React, {
  useState, useRef, useEffect, useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles,
  Ticket, Heart, Calendar, TrendingUp, HelpCircle,
  ChevronRight, Minimize2, RefreshCw, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useWishlist } from '../context/WishlistContext';
import { useEvents } from '../context/EventContext';
import { formatCurrency, formatShortDate, formatTime } from '../utils/helpers';

// ─────────────────────────────────────────────────────────────────────────────
//  Quick-action chips (Initial fallback)
// ─────────────────────────────────────────────────────────────────────────────
const CHIPS = {
  guest: [
    { label: 'What events are available?',    icon: Calendar,    id: 'events_available' },
    { label: 'How do I book a ticket?',       icon: Ticket,      id: 'how_to_book' },
    { label: 'Payment methods',               icon: HelpCircle, id: 'payment_methods' },
    { label: 'Cancellation policy',           icon: HelpCircle,  id: 'cancel_policy' },
  ],
  user: [
    { label: 'Show my bookings',              icon: Ticket,      id: 'my_bookings' },
    { label: 'My wishlist events',            icon: Heart,       id: 'my_wishlist' },
    { label: 'Upcoming recommendations',      icon: Sparkles,    id: 'recommendations' },
    { label: 'Events happening today',        icon: Calendar,    id: 'today_events' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  UI COMPONENT: Mini Event Card for inside Chat
// ─────────────────────────────────────────────────────────────────────────────
function ChatEventCard({ event, onClick }) {
  // SAFETY CHECK: Ensure price is a number, fallback to 0 to avoid NaN
  const price = Number(event.price) || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm flex gap-3 group hover:border-primary-400 transition-colors cursor-pointer"
      onClick={() => onClick(event.id)}
    >
      {/* Image Placeholder / Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <Sparkles className="w-6 h-6 text-gray-400" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{event.title}</h4>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <Calendar className="w-3 h-3" />
          <span>{formatShortDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{event.city || 'Location TBA'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {formatCurrency(price)}
          </span>
          <span className="text-[10px] font-medium text-gray-400 group-hover:text-primary-500 transition-colors">
            View &rarr;
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ADVANCED LOCAL LOGIC ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function generateLocalResponse(input, context) {
  const {
    user,
    confirmedBookings,
    totalSpent,
    upcomingEvents,
    wishlistedEvents,
    featuredEvents,
  } = context;

  const text = input.toLowerCase().trim();
  let responseText = "";
  let responseData = []; // For cards
  let suggestions = [];

  // Helper to find specific event mentioned in text
  const mentionedEvent = upcomingEvents.find(e => text.includes(e.title.toLowerCase()));

  // 1. SPECIFIC EVENT LOOKUP
  if (mentionedEvent) {
    return {
      text: `Here are the details for **${mentionedEvent.title}**:`,
      type: 'single_event',
      data: [mentionedEvent],
      suggestions: ['Book tickets', 'Add to wishlist'],
    };
  }

  // 2. GREETING (Proactive)
  if (text.match(/^(hi|hello|hey|greetings)/)) {
    const today = new Date();
    const todaysBooking = confirmedBookings.find(b => {
      const bDate = new Date(b.events?.date);
      return bDate.toDateString() === today.toDateString();
    });

    if (todaysBooking) {
      responseText = `Hey **${user.name.split(' ')[0]}**! 👋 \n\nDon't forget, you have **${todaysBooking.events.title}** today! Have a great time.`;
      suggestions = ['View Ticket', 'Contact Support'];
    } else if (confirmedBookings.length > 0) {
      responseText = `Welcome back, **${user.name.split(' ')[0]}**! 👋 \n\nYou have **${confirmedBookings.length}** upcoming bookings. Need help with anything?`;
      suggestions = ['Show my bookings', 'Find new events'];
    } else {
      responseText = `Hello! 👋 I'm **Evie**. I can help you discover events, manage bookings, or find the best parties in town.`;
      suggestions = ['What events are available?', 'How do I book?'];
    }
    return { text: responseText, suggestions };
  }

  // 3. MY BOOKINGS (Rich Cards)
  if (text.includes('my booking') || text.includes('my ticket')) {
    if (!user) return { text: "Please **sign in** to view your bookings.", suggestions: ['Sign in'] };
    if (confirmedBookings.length === 0) return { text: "You don't have any bookings yet. Let's find an event!", suggestions: ['Show events', 'My wishlist'] };
    
    responseText = `Here are your upcoming bookings:`;
    // Map to event objects, ensuring we don't crash if events data is missing
    responseData = confirmedBookings
      .map(b => b.events)
      .filter(e => e != null); 
    suggestions = ['Cancel a booking', 'Total spent'];
    return { text: responseText, type: 'booking_list', data: responseData, suggestions };
  }

  // 4. TOTAL SPENT
  if (text.includes('spent') || text.includes('cost')) {
    return {
      text: `You have spent a total of **${formatCurrency(totalSpent)}** on Eventify! 🎉`,
      suggestions: ['Show bookings', 'View wishlist'],
    };
  }

  // 5. WISHLIST
  if (text.includes('wishlist') || text.includes('saved')) {
    if (!user) return { text: "Sign in to view your saved events.", suggestions: ['Sign in'] };
    if (wishlistedEvents.length === 0) return { text: "Your wishlist is empty.", suggestions: ['Browse events'] };
    
    responseText = `You have **${wishlistedEvents.length}** events saved:`;
    return { text: responseText, type: 'event_list', data: wishlistedEvents, suggestions: ['Book one now', 'Remove from list'] };
  }

  // 6. RECOMMENDATIONS
  if (text.includes('recommend') || text.includes('suggest')) {
    let recommended = [];
    if (wishlistedEvents.length > 0) {
       const categories = wishlistedEvents.map(e => e.category);
       recommended = upcomingEvents.filter(e => categories.includes(e.category) && !wishlistedEvents.find(we => we.id === e.id));
    }
    if (recommended.length === 0) recommended = featuredEvents.length ? featuredEvents : upcomingEvents;
    
    if (recommended.length === 0) return { text: "No events found at the moment." };

    responseText = "Based on your interests, you might like these:";
    return { text: responseText, type: 'event_list', data: recommended.slice(0, 3), suggestions: ['View details', 'Book tickets'] };
  }

  // 7. EVENTS AVAILABLE / NEAR ME
  if (text.includes('event') && (text.includes('available') || text.includes('upcoming') || text.includes('nearby'))) {
    if (upcomingEvents.length === 0) return { text: "No upcoming events found." };
    
    responseText = `Here are **${upcomingEvents.length}** upcoming events:`;
    return { text: responseText, type: 'event_list', data: upcomingEvents.slice(0, 4), suggestions: ['Filter by category', 'Show VIP only'] };
  }

  // 8. EVENTS TODAY
  if (text.includes('today')) {
     const todayStr = new Date().toDateString();
     const todaysEvents = upcomingEvents.filter(e => new Date(e.date).toDateString() === todayStr);
     
     if (todaysEvents.length === 0) return { text: "There are no events happening today.", suggestions: ['Events tomorrow', 'This weekend'] };
     
     responseText = "Here is what's happening today:";
     return { text: responseText, type: 'event_list', data: todaysEvents, suggestions: ['Get tickets now'] };
  }

  // 9. VIP, PAYMENT, CANCEL, HOW TO (Text only)
  if (text.includes('vip')) {
    return { text: "We offer **VIP tickets** for most events! VIP usually includes early entry, premium seating, and exclusive bar access.", suggestions: ['Show events with VIP'] };
  }
  if (text.includes('payment') || text.includes('pay')) {
    return { text: "We accept **Visa, Mastercard, Amex, Apple Pay, and Google Pay**. Secure processing by Stripe.", suggestions: [] };
  }
  if (text.includes('cancel') || text.includes('refund')) {
    return { text: "You can cancel bookings up to **48 hours** before the event.\n\nGo to Dashboard > Bookings to manage them.", suggestions: ['Go to Dashboard'] };
  }
  if (text.includes('how to book')) {
    return { text: "1. Find an event.\n2. Click 'Book Ticket'.\n3. Choose Standard or VIP.\n4. Pay securely.", suggestions: ['Browse events'] };
  }

  // DEFAULT
  return { 
    text: "I can help you find events, check bookings, or give recommendations.", 
    suggestions: ['My bookings', 'Upcoming events', 'Help'] 
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Message Bubble with Rich Data Support
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg, user, onEventClick }) {
  const isUser = msg.role === 'user';
  const avatar = user?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=80`;

  const renderText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith('**') ? <strong key={j} className="font-semibold">{p.slice(2, -2)}</strong> : p
      );
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 mt-1">
            <span className="text-primary-400 mt-0.5 flex-shrink-0 text-xs">●</span>
            <span>{parts.slice(1)}</span>
          </div>
        );
      }
      return <div key={i} className={i > 0 ? 'mt-1' : ''}>{parts}</div>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <img src={avatar} alt="You" className="w-7 h-7 rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-800" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center ring-2 ring-primary-200 dark:ring-primary-800">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-gray-700 shadow-sm'
        }`}>
          {msg.loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : (
            <>
              {renderText(msg.content)}
              {/* Render Rich Data Cards if available */}
              {msg.data && msg.data.length > 0 && (
                <div className="mt-3 space-y-3">
                  {msg.data.map((item, idx) => (
                    <ChatEventCard key={idx} event={item} onClick={onEventClick} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Timestamp for user messages (nice touch) */}
        {isUser && (
          <span className="text-[10px] text-gray-400 mt-1 mr-1">Just now</span>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main ChatBot Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatBot() {
  const { user }                    = useAuth();
  const { bookings }                = useBookings();
  const { wishlistIds }             = useWishlist();
  const { events }                  = useEvents();

  // --- NAVIGATION HANDLER ---
  // This function handles navigation when a user clicks a card.
  const handleNavigate = (eventId) => {
    // IMPLEMENTATION: Change this URL structure to match your app's routing
    // Example: window.location.href = `/event/${eventId}`;
    // For this demo, we log it. If you are using Next.js, use router.push(`/event/${eventId}`)
    
    console.log("Navigating to Event ID:", eventId);
    
    // UNCOMMENT THE LINE BELOW TO ACTUALLY NAVIGATE:
    window.location.href = `/event/${eventId}`; 
    
    // OR if your route is /events/:id
    // window.location.href = `/events/${eventId}`;
  };

  const [open, setOpen]       = useState(false);
  const [minimized, setMin]   = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMsgs]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setGreeted] = useState(false);
  const [unread, setUnread]   = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  const endRef    = useRef(null);
  const inputRef  = useRef(null);

  const chips = user ? CHIPS.user : CHIPS.guest;

  useEffect(() => {
    if (open && !minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, minimized, suggestions]);

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, minimized]);

  const handleOpen = () => {
    setOpen(true);
    setMin(false);
    setUnread(0);
    if (!hasGreeted) {
      setGreeted(true);
      const greeting = user
        ? `Hey ${user.name.split(' ')[0]}! 👋 I'm **Evie**.\n\nHow can I help you today?`
        : `Hello! 👋 I'm **Evie**.\n\nI can help you find events or answer questions.`;
      
      // Set initial greeting
      setMsgs([{ role: 'assistant', content: greeting, id: 'greeting' }]);
      setSuggestions(['Show events', 'How to book']);
    }
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text, id: Date.now() };
    const thinkingMsg = { role: 'assistant', content: '', loading: true, id: 'thinking' };

    setMsgs(prev => [...prev, userMsg, thinkingMsg]);
    setLoading(true);
    setSuggestions([]); // Clear suggestions while thinking

    // 1. Prepare Context
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalSpent = confirmedBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
    const wishlistedEvents = events.filter(e => wishlistIds.has(e.id));
    const upcomingEvents = events
      .filter(e => e.status === 'published' && new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const featuredEvents = upcomingEvents.filter(e => e.featured);

    const botContext = {
      user,
      confirmedBookings,
      totalSpent,
      upcomingEvents,
      wishlistedEvents,
      featuredEvents,
    };

    // 2. Simulate Latency
    setTimeout(() => {
      try {
        // 3. Generate Response
        const response = generateLocalResponse(text, botContext);

        setMsgs(prev => [
          ...prev.filter(m => m.id !== 'thinking'),
          { 
            role: 'assistant', 
            content: response.text, 
            id: Date.now(),
            data: response.data || [], // Attach rich data
          },
        ]);

        // Update dynamic suggestions
        setSuggestions(response.suggestions || []);

        if (minimized) setUnread(c => c + 1);
      } catch (err) {
        console.error(err);
        setMsgs(prev => [
          ...prev.filter(m => m.id !== 'thinking'),
          { role: 'assistant', content: '⚠️ Something went wrong.', id: Date.now() },
        ]);
      } finally {
        setLoading(false);
      }
    }, 800); // Slightly longer delay for "thinking" feel
  }, [loading, user, bookings, wishlistIds, events, minimized]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChip = (chip) => sendMessage(chip.label);

  const handleReset = () => {
    setMsgs([]);
    setGreeted(false);
    setSuggestions([]);
    setUnread(0);
    setTimeout(handleOpen, 50);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full shadow-glow flex items-center justify-center text-white"
          >
            <MessageCircle className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
            <span className="absolute inset-0 rounded-full border-2 border-primary-400 animate-ping opacity-40" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chatwindow"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[390px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            style={{ maxHeight: minimized ? 'auto' : '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm leading-none">Evie</p>
                <p className="text-primary-200 text-xs mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  Online · Smart Assistant
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors" title="Reset Chat">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setMin(v => !v); setUnread(0); }} className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50 dark:bg-gray-900/50">
                  {messages.map(msg => (
                    <MessageBubble 
                      key={msg.id} 
                      msg={msg} 
                      user={user} 
                      onEventClick={handleNavigate} 
                    />
                  ))}
                  <div ref={endRef} />
                </div>

                {/* Dynamic Suggestions (Replaces static chips after interaction) */}
                {suggestions.length > 0 && (
                  <div className="px-4 pb-2 bg-white dark:bg-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(s)}
                          disabled={loading}
                          className="text-xs px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-200 dark:border-primary-800 transition-colors disabled:opacity-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback Chips (Only visible if no suggestions yet) */}
                {messages.length <= 1 && suggestions.length === 0 && (
                  <div className="px-4 pb-3 bg-white dark:bg-gray-900">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                      Quick questions
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {chips.slice(0, 3).map(chip => (
                        <button
                          key={chip.id}
                          onClick={() => handleChip(chip)}
                          disabled={loading}
                          className="flex items-center gap-2.5 text-left text-sm px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 transition-all disabled:opacity-50 group"
                        >
                          <chip.icon className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                          <span className="flex-1 leading-tight">{chip.label}</span>
                          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={loading}
                    className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all disabled:opacity-60"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center hover:from-primary-600 hover:to-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                
                <div className="text-center py-1.5 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800">
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 font-medium">
                    Eventify AI · Local & Secure
                  </p>
                </div>
              </>
            )}

            {minimized && unread > 0 && (
              <div className="bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between cursor-pointer" onClick={() => { setMin(false); setUnread(0); }}>
                <span>{unread} new message{unread > 1 ? 's' : ''}</span>
                <span className="text-primary-500 text-xs font-semibold">View</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}