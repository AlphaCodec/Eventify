/**
 * Eventify Offline Chat Engine
 * Full intent detection, slot filling, and response generation
 * — zero external API calls, uses only live app data.
 */

import {
  formatCurrency, formatShortDate, formatLongDate,
  formatTime, spotsLeft, capacityPercent, truncate,
} from '../utils/helpers';

// ─── Response types ────────────────────────────────────────────────────────
export const MSG = {
  TEXT:        'text',
  EVENT_CARD:  'event_card',
  BOOKING_CARD:'booking_card',
  EVENT_LIST:  'event_list',
  BOOKING_LIST:'booking_list',
  ACTION_LIST: 'action_list',
  QUICK_CHIPS: 'quick_chips',
  STAT:        'stat',
};

// ─── Intent map ────────────────────────────────────────────────────────────
const INTENTS = [
  // Greetings
  { id: 'greet',           patterns: [/^(hi|hello|hey|good\s*(morning|evening|afternoon)|howdy|sup|what'?s up)/i] },
  { id: 'thanks',          patterns: [/\b(thank(s| you)|thx|ty|cheers)\b/i] },
  { id: 'bye',             patterns: [/\b(bye|goodbye|see ya|later|close|quit|exit)\b/i] },

  // Bookings
  { id: 'my_bookings',     patterns: [/my (booking|ticket|reservation|order)s?/i, /what (have|did) i (book|reserve|buy)/i, /show.*book/i] },
  { id: 'booking_status',  patterns: [/booking (status|ref|reference|confirm)/i, /is my (booking|ticket) (confirm|valid|active)/i] },
  { id: 'cancel_booking',  patterns: [/cancel\b/i, /refund\b/i, /cancel.*ticket/i, /how.*cancel/i] },
  { id: 'upcoming',        patterns: [/upcoming|next (event|booking|show)/i, /when.*next/i, /what.*coming up/i] },
  { id: 'total_spent',     patterns: [/(how much|total).*(spend|spent|pay|paid|cost)/i, /spending|expenditure/i] },
  { id: 'booking_history', patterns: [/history|past (booking|event|ticket)|previous/i] },

  // Events — search/browse
  { id: 'search_event',    patterns: [/find|search|look.*for|any.*event|show.*event|list.*event/i] },
  { id: 'featured',        patterns: [/featured|top|best|popular|trending|highlight/i] },
  { id: 'by_category',     patterns: [/(music|technology|tech|food|sport|art|business|health|education|travel)\s*(event|show|concert|conference)?/i] },
  { id: 'by_city',         patterns: [/in\s+(new york|san francisco|los angeles|chicago|austin|miami|boston|seattle)/i, /events?\s+in\b/i] },
  { id: 'free_events',     patterns: [/free\s*event|no.*cost|free.*ticket/i] },
  { id: 'cheap_events',    patterns: [/cheap|affordable|budget|low.?price|inexpensive/i] },
  { id: 'sold_out',        patterns: [/sold.?out|full|no.*spot|availability/i] },
  { id: 'event_count',     patterns: [/how many event|total.*event|number.*event/i] },

  // Event detail
  { id: 'event_price',     patterns: [/(price|cost|fee|how much).*(event|ticket)/i, /ticket (price|cost)/i] },
  { id: 'vip_info',        patterns: [/vip|premium|upgrade/i] },
  { id: 'event_date',      patterns: [/when.*event|date.*event|event.*date|event.*when/i] },
  { id: 'event_location',  patterns: [/where.*event|location|venue|address/i] },
  { id: 'organizer',       patterns: [/organiz(er|ation)|who.*organiz|host\b/i] },

  // Wishlist
  { id: 'my_wishlist',     patterns: [/wishlist|saved|favourite|favorite|heart/i] },
  { id: 'recommend',       patterns: [/recommend|suggest|what should|what.*try|for me|personaliz/i] },

  // Account / Help
  { id: 'account_info',    patterns: [/my (account|profile|info|detail)/i, /who am i/i] },
  { id: 'how_to_book',     patterns: [/how.*book|how.*buy|how.*purchas|how.*get.*ticket/i] },
  { id: 'how_to_review',   patterns: [/review|rate|rating|feedback/i] },
  { id: 'payment_info',    patterns: [/payment|pay|stripe|card|credit/i] },
  { id: 'qr_ticket',       patterns: [/qr|e.?ticket|digital ticket|scan/i] },
  { id: 'help',            patterns: [/help|what can you|what do you|features?|support|guide/i] },
  { id: 'categories',      patterns: [/categor|genre|type.*event/i] },

  // Navigate
  { id: 'go_dashboard',    patterns: [/go.*dashboard|open.*dashboard|dashboard/i] },
  { id: 'go_events',       patterns: [/go.*events?\s*page|browse.*event|all.*event/i] },
  { id: 'go_profile',      patterns: [/go.*profile|my.*setting|account.*setting/i] },
  { id: 'go_admin',        patterns: [/admin|admin panel|admin.*page/i] },
];

// ─── Detect intent ─────────────────────────────────────────────────────────
export function detectIntent(text) {
  const lower = text.toLowerCase().trim();
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => p.test(lower))) return intent.id;
  }
  return 'unknown';
}

// ─── Extract slots ─────────────────────────────────────────────────────────
export function extractSlots(text) {
  const lower = text.toLowerCase();
  const slots = {};

  // Category
  const cats = ['music','technology','tech','food','sport','arts','business','health','education','travel'];
  for (const c of cats) {
    if (lower.includes(c)) { slots.category = c === 'tech' ? 'technology' : c === 'sport' ? 'sports' : c; break; }
  }

  // City
  const cities = ['new york','san francisco','los angeles','chicago','austin','miami','boston','seattle'];
  for (const city of cities) {
    if (lower.includes(city)) { slots.city = city; break; }
  }

  // Max price
  const priceMatch = lower.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|\$?(\d+)\s*or\s*less/);
  if (priceMatch) slots.maxPrice = parseFloat(priceMatch[1] || priceMatch[2] || priceMatch[3]);

  return slots;
}

// ─── Main response builder ─────────────────────────────────────────────────
export function buildResponse(intentId, { user, bookings, wishlistIds, events }, text, context) {
  const slots          = extractSlots(text);
  const now            = new Date();
  const upcoming       = events.filter(e => e.status === 'published' && new Date(e.date) >= now)
                               .sort((a,b) => new Date(a.date) - new Date(b.date));
  const featured       = upcoming.filter(e => e.featured);
  const myBookings     = bookings.filter(b => b.status === 'confirmed');
  const cancelledBks   = bookings.filter(b => b.status === 'cancelled');
  const pastBookings   = myBookings.filter(b => b.events?.date && new Date(b.events.date) < now);
  const upcomingBks    = myBookings.filter(b => b.events?.date && new Date(b.events.date) >= now);
  const totalSpent     = myBookings.reduce((s, b) => s + Number(b.total_price), 0);
  const wishlistEvents = events.filter(e => wishlistIds.has(e.id));

  // ── Greetings ─────────────────────────────────────────────────────────────
  if (intentId === 'greet') {
    const name = user ? `, ${user.name.split(' ')[0]}` : '';
    const hour = now.getHours();
    const tod  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return [
      { type: MSG.TEXT, content: `${tod}${name}! 👋 I'm **Evie**, your Eventify assistant. I can help you with events, bookings, your wishlist, and more.` },
      helpChips(user),
    ];
  }

  if (intentId === 'thanks') {
    return [{ type: MSG.TEXT, content: 'You\'re welcome! 😊 Is there anything else I can help you with?' }];
  }

  if (intentId === 'bye') {
    return [{ type: MSG.TEXT, content: 'See you soon! Enjoy your events 🎉' }];
  }

  // ── Help ──────────────────────────────────────────────────────────────────
  if (intentId === 'help') {
    return [
      { type: MSG.TEXT, content: `Here's what I can help you with:` },
      { type: MSG.ACTION_LIST, items: [
        { label: '🎫 View my bookings',       intent: 'my bookings' },
        { label: '❤️ My saved events',        intent: 'my wishlist' },
        { label: '🔍 Find events',            intent: 'search event' },
        { label: '⭐ Featured events',        intent: 'featured' },
        { label: '💡 Get recommendations',    intent: 'recommend' },
        { label: '📖 How to book a ticket',   intent: 'how to book' },
        { label: '❌ How to cancel',          intent: 'cancel booking' },
        { label: '🎟️ About e-tickets & QR',  intent: 'qr ticket' },
      ]},
    ];
  }

  // ── My Bookings ───────────────────────────────────────────────────────────
  if (intentId === 'my_bookings') {
    if (!user) return requireLogin('view your bookings');
    if (!bookings.length) return [
      { type: MSG.TEXT, content: `You haven't made any bookings yet, ${user.name.split(' ')[0]}. Browse our events and book your first experience!` },
      { type: MSG.ACTION_LIST, items: [{ label: '🔍 Browse all events', link: '/events' }, { label: '⭐ See featured events', intent: 'featured' }] },
    ];
    return [
      { type: MSG.TEXT, content: `You have **${myBookings.length} confirmed** booking${myBookings.length !== 1 ? 's' : ''}${upcomingBks.length ? ` (${upcomingBks.length} upcoming)` : ''}:` },
      { type: MSG.BOOKING_LIST, bookings: myBookings.slice(0, 4) },
      ...( myBookings.length > 4 ? [{ type: MSG.ACTION_LIST, items: [{ label: '📋 View all bookings', link: '/dashboard' }] }] : [] ),
    ];
  }

  // ── Upcoming bookings ────────────────────────────────────────────────────
  if (intentId === 'upcoming') {
    if (!user) return requireLogin('see upcoming events');
    if (!upcomingBks.length) return [
      { type: MSG.TEXT, content: 'You have no upcoming bookings right now.' },
      { type: MSG.ACTION_LIST, items: [{ label: '🔍 Browse events', link: '/events' }] },
    ];
    const next = upcomingBks[0];
    const ev   = next.events || {};
    return [
      { type: MSG.TEXT, content: `Your next event is coming up! 🎉` },
      { type: MSG.BOOKING_LIST, bookings: upcomingBks.slice(0, 3) },
    ];
  }

  // ── Cancel booking ───────────────────────────────────────────────────────
  if (intentId === 'cancel_booking') {
    if (!user) return requireLogin('cancel a booking');
    if (!myBookings.length) return [{ type: MSG.TEXT, content: 'You have no active bookings to cancel.' }];
    return [
      { type: MSG.TEXT, content: `To cancel a booking:\n\n1. Go to your **Dashboard**\n2. Click the **Bookings** tab\n3. Find your booking and click **Cancel**\n\nNote: Cancellation is immediate and cannot be undone.` },
      { type: MSG.ACTION_LIST, items: [{ label: '📋 Go to Dashboard', link: '/dashboard' }] },
    ];
  }

  // ── Booking history ───────────────────────────────────────────────────────
  if (intentId === 'booking_history') {
    if (!user) return requireLogin('see your history');
    if (!pastBookings.length) return [{ type: MSG.TEXT, content: 'No past bookings yet — all your confirmed bookings are still upcoming!' }];
    return [
      { type: MSG.TEXT, content: `You've attended **${pastBookings.length}** event${pastBookings.length !== 1 ? 's' : ''} so far:` },
      { type: MSG.BOOKING_LIST, bookings: pastBookings.slice(0, 3) },
    ];
  }

  // ── Total spent ───────────────────────────────────────────────────────────
  if (intentId === 'total_spent') {
    if (!user) return requireLogin('see your spending');
    if (!myBookings.length) return [{ type: MSG.TEXT, content: 'You haven\'t made any purchases yet.' }];
    const avgTicket = totalSpent / myBookings.reduce((s, b) => s + b.quantity, 0);
    return [
      { type: MSG.STAT, stats: [
        { label: 'Total Spent',       value: formatCurrency(totalSpent),   icon: '💰' },
        { label: 'Bookings',          value: myBookings.length,            icon: '🎫' },
        { label: 'Avg per ticket',    value: formatCurrency(avgTicket),    icon: '📊' },
        { label: 'Events attended',   value: pastBookings.length,          icon: '✅' },
      ]},
    ];
  }

  // ── Featured events ───────────────────────────────────────────────────────
  if (intentId === 'featured') {
    if (!featured.length) return [{ type: MSG.TEXT, content: 'No featured events right now, but check out all our upcoming events!' },
      { type: MSG.ACTION_LIST, items: [{ label: '🔍 Browse all events', link: '/events' }] }];
    return [
      { type: MSG.TEXT, content: `✨ Here are our **${featured.length} featured events**:` },
      { type: MSG.EVENT_LIST, events: featured.slice(0, 4) },
      ...(featured.length > 4 ? [{ type: MSG.ACTION_LIST, items: [{ label: '📅 See all featured', link: '/events?category=featured' }] }] : []),
    ];
  }

  // ── By category ───────────────────────────────────────────────────────────
  if (intentId === 'by_category') {
    const cat       = slots.category;
    const catLabel  = cat ? (cat.charAt(0).toUpperCase() + cat.slice(1)) : null;
    const catEvents = cat ? upcoming.filter(e => e.category.toLowerCase() === cat.toLowerCase()) : upcoming;
    if (cat && !catEvents.length) return [
      { type: MSG.TEXT, content: `No upcoming **${catLabel}** events right now. Try another category or browse all.` },
      categorySuggest(),
    ];
    if (!cat) {
      return [
        { type: MSG.TEXT, content: 'Which category are you interested in?' },
        categorySuggest(),
      ];
    }
    return [
      { type: MSG.TEXT, content: `Found **${catEvents.length}** upcoming **${catLabel}** event${catEvents.length !== 1 ? 's' : ''}:` },
      { type: MSG.EVENT_LIST, events: catEvents.slice(0, 4) },
      ...(catEvents.length > 4 ? [{ type: MSG.ACTION_LIST, items: [{ label: `📅 All ${catLabel} events`, link: `/events?category=${catLabel}` }] }] : []),
    ];
  }

  // ── By city ───────────────────────────────────────────────────────────────
  if (intentId === 'by_city') {
    const city       = slots.city;
    const cityLabel  = city ? city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
    const cityEvents = city ? upcoming.filter(e => e.city.toLowerCase().includes(city)) : upcoming;
    if (city && !cityEvents.length) return [
      { type: MSG.TEXT, content: `No upcoming events in **${cityLabel}** right now.` },
      { type: MSG.ACTION_LIST, items: [{ label: '🌍 Browse all events', link: '/events' }] },
    ];
    if (!city) return [{ type: MSG.TEXT, content: 'Which city are you looking for? Try: New York, San Francisco, Los Angeles, Chicago, Austin, Miami, Boston, or Seattle.' }];
    return [
      { type: MSG.TEXT, content: `Found **${cityEvents.length}** event${cityEvents.length !== 1 ? 's' : ''} in **${cityLabel}**:` },
      { type: MSG.EVENT_LIST, events: cityEvents.slice(0, 4) },
    ];
  }

  // ── Search events (generic) ───────────────────────────────────────────────
  if (intentId === 'search_event') {
    const q      = text.replace(/find|search|look.*for|any|show|list|events?/gi, '').trim();
    const words  = q.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !['the','and','for','with'].includes(w));
    const scored = upcoming.map(e => {
      let score = 0;
      const haystack = `${e.title} ${e.category} ${e.city} ${e.organizer} ${(e.tags||[]).join(' ')}`.toLowerCase();
      words.forEach(w => { if (haystack.includes(w)) score++; });
      return { ...e, _score: score };
    }).filter(e => e._score > 0 || words.length === 0).sort((a, b) => b._score - a._score);

    if (!scored.length || words.length === 0) {
      return [
        { type: MSG.TEXT, content: `Here are all ${upcoming.length} upcoming events:` },
        { type: MSG.EVENT_LIST, events: upcoming.slice(0, 5) },
        ...(upcoming.length > 5 ? [{ type: MSG.ACTION_LIST, items: [{ label: '📅 Browse all events', link: '/events' }] }] : []),
      ];
    }
    return [
      { type: MSG.TEXT, content: `Found **${scored.length}** matching event${scored.length !== 1 ? 's' : ''}:` },
      { type: MSG.EVENT_LIST, events: scored.slice(0, 4) },
    ];
  }

  // ── Free events ───────────────────────────────────────────────────────────
  if (intentId === 'free_events') {
    const free = upcoming.filter(e => Number(e.price) === 0);
    if (!free.length) return [{ type: MSG.TEXT, content: 'No free events at the moment, but we have some very affordable options! Check out budget-friendly events below.' },
      cheapEventsResponse(upcoming)];
    return [
      { type: MSG.TEXT, content: `🆓 **${free.length} free event${free.length !== 1 ? 's' : ''}** available:` },
      { type: MSG.EVENT_LIST, events: free.slice(0, 4) },
    ];
  }

  // ── Cheap events ─────────────────────────────────────────────────────────
  if (intentId === 'cheap_events') {
    return cheapEventsResponse(upcoming);
  }

  // ── Sold out ──────────────────────────────────────────────────────────────
  if (intentId === 'sold_out') {
    const soldOut  = upcoming.filter(e => spotsLeft(e.attendees||0, e.capacity||1) === 0);
    const hasSpots = upcoming.filter(e => spotsLeft(e.attendees||0, e.capacity||1) > 0);
    return [
      { type: MSG.TEXT, content: soldOut.length
          ? `⚠️ **${soldOut.length}** event${soldOut.length !== 1 ? 's are' : ' is'} sold out. Here are **${hasSpots.length}** events with spots still available:`
          : `Great news! All current events have spots available.` },
      ...(hasSpots.length ? [{ type: MSG.EVENT_LIST, events: hasSpots.slice(0, 4) }] : []),
    ];
  }

  // ── Event count ───────────────────────────────────────────────────────────
  if (intentId === 'event_count') {
    const cats = [...new Set(upcoming.map(e => e.category))];
    return [
      { type: MSG.STAT, stats: [
        { label: 'Total Events',      value: events.filter(e=>e.status==='published').length, icon: '📅' },
        { label: 'Upcoming',          value: upcoming.length,                                 icon: '🗓️' },
        { label: 'Featured',          value: featured.length,                                 icon: '⭐' },
        { label: 'Categories',        value: cats.length,                                     icon: '🏷️' },
      ]},
    ];
  }

  // ── Event price ───────────────────────────────────────────────────────────
  if (intentId === 'event_price') {
    const sorted = [...upcoming].sort((a, b) => a.price - b.price);
    const min    = sorted[0];
    const max    = sorted[sorted.length - 1];
    return [
      { type: MSG.TEXT, content: `Ticket prices range from **${formatCurrency(min?.price || 0)}** to **${formatCurrency(max?.price || 0)}**.\n\nMost events also offer **VIP upgrades** for premium access.` },
      { type: MSG.ACTION_LIST, items: [
        { label: '💵 Sort by price (low–high)', link: '/events?sort=price_asc' },
        { label: '⭐ About VIP tickets', intent: 'vip_info' },
      ]},
    ];
  }

  // ── VIP info ─────────────────────────────────────────────────────────────
  if (intentId === 'vip_info') {
    const vipEvents = upcoming.filter(e => e.price_vip > e.price).slice(0, 3);
    return [
      { type: MSG.TEXT, content: `**VIP tickets** offer premium experiences:\n• Priority seating / entry\n• Exclusive lounge access\n• Meet & greet opportunities\n• Premium food & drink packages\n\nVIP prices vary by event — typically 2–3× the standard price.` },
      ...(vipEvents.length ? [
        { type: MSG.TEXT, content: 'Events with VIP available:' },
        { type: MSG.EVENT_LIST, events: vipEvents, showVip: true },
      ] : []),
    ];
  }

  // ── Wishlist ──────────────────────────────────────────────────────────────
  if (intentId === 'my_wishlist') {
    if (!user) return requireLogin('view your wishlist');
    if (!wishlistEvents.length) return [
      { type: MSG.TEXT, content: `Your wishlist is empty. Tap the ❤️ heart on any event to save it!` },
      { type: MSG.ACTION_LIST, items: [{ label: '🔍 Browse events', link: '/events' }] },
    ];
    return [
      { type: MSG.TEXT, content: `You have **${wishlistEvents.length}** saved event${wishlistEvents.length !== 1 ? 's' : ''}:` },
      { type: MSG.EVENT_LIST, events: wishlistEvents.slice(0, 4) },
      { type: MSG.ACTION_LIST, items: [{ label: '❤️ Open full wishlist', link: '/wishlist' }] },
    ];
  }

  // ── Recommendations ───────────────────────────────────────────────────────
  if (intentId === 'recommend') {
    if (!user) {
      return [
        { type: MSG.TEXT, content: `For personalised picks, sign in so I can see what you love! For now, here are our top-rated events:` },
        { type: MSG.EVENT_LIST, events: featured.slice(0, 4) },
      ];
    }
    // Build recs from wishlist categories + booking history
    const bookedCats = myBookings.map(b => b.events?.category).filter(Boolean);
    const wishedCats = wishlistEvents.map(e => e.category);
    const prefCats   = [...new Set([...wishedCats, ...bookedCats])];
    const bookedIds  = new Set(myBookings.map(b => b.event_id));
    const wishIds    = new Set([...wishlistIds]);

    let recs = upcoming.filter(e => !bookedIds.has(e.id) && !wishIds.has(e.id));
    if (prefCats.length) {
      recs = [
        ...recs.filter(e => prefCats.includes(e.category)),
        ...recs.filter(e => !prefCats.includes(e.category)),
      ];
    }

    if (!recs.length) return [{ type: MSG.TEXT, content: `You've explored everything! Check back soon for new events.` }];
    const catNote = prefCats.length ? ` based on your interest in **${prefCats.slice(0,2).join(' & ')}**` : '';
    return [
      { type: MSG.TEXT, content: `🎯 Recommendations for you${catNote}:` },
      { type: MSG.EVENT_LIST, events: recs.slice(0, 4) },
    ];
  }

  // ── Account info ──────────────────────────────────────────────────────────
  if (intentId === 'account_info') {
    if (!user) return requireLogin('view account details');
    return [
      { type: MSG.STAT, stats: [
        { label: 'Name',         value: user.name,                    icon: '👤' },
        { label: 'Role',         value: user.role || 'Member',        icon: '🏷️' },
        { label: 'Bookings',     value: myBookings.length,            icon: '🎫' },
        { label: 'Total Spent',  value: formatCurrency(totalSpent),   icon: '💰' },
      ]},
      { type: MSG.ACTION_LIST, items: [{ label: '⚙️ Account Settings', link: '/profile' }] },
    ];
  }

  // ── How to book ───────────────────────────────────────────────────────────
  if (intentId === 'how_to_book') {
    return [
      { type: MSG.TEXT, content: `Booking a ticket is simple:\n\n1. Browse or search **Events**\n2. Click any event to open it\n3. Choose **Standard** or **VIP** ticket\n4. Select quantity (up to 10)\n5. Click **Book Now · $X**\n6. Enter your card details in the secure Stripe payment form\n7. Done! Your **QR e-ticket** is instantly available in Dashboard.` },
      { type: MSG.ACTION_LIST, items: [
        { label: '📅 Browse events', link: '/events' },
        { label: '🎟️ About e-tickets', intent: 'qr_ticket' },
      ]},
    ];
  }

  // ── QR ticket ────────────────────────────────────────────────────────────
  if (intentId === 'qr_ticket') {
    return [
      { type: MSG.TEXT, content: `After booking, a **digital QR e-ticket** is generated instantly:\n\n• Open **Dashboard → Bookings**\n• Click **E-Ticket** on any confirmed booking\n• Show the QR code at the venue entrance\n• No printing needed!` },
      { type: MSG.ACTION_LIST, items: [{ label: '📋 View my tickets', link: '/dashboard' }] },
    ];
  }

  // ── Review info ───────────────────────────────────────────────────────────
  if (intentId === 'how_to_review') {
    return [
      { type: MSG.TEXT, content: `You can review an event after attending it:\n\n1. Go to the **Event Details** page\n2. Click the **Reviews** tab\n3. Select a star rating and write your comment\n4. Click **Submit**\n\nYou need a confirmed booking for that event to leave a review.` },
    ];
  }

  // ── Payment info ──────────────────────────────────────────────────────────
  if (intentId === 'payment_info') {
    return [
      { type: MSG.TEXT, content: `Eventify uses **Stripe** for secure payments:\n\n• All major credit & debit cards accepted\n• Visa, Mastercard, Amex, Discover\n• 256-bit SSL encryption\n• Payments processed instantly\n• Receipts sent via email` },
    ];
  }

  // ── Categories ────────────────────────────────────────────────────────────
  if (intentId === 'categories') {
    return [{ type: MSG.TEXT, content: 'Browse events by category:' }, categorySuggest()];
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  if (intentId === 'go_dashboard') {
    if (!user) return requireLogin('access your dashboard');
    return [{ type: MSG.TEXT, content: 'Taking you to your Dashboard!' }, { type: MSG.ACTION_LIST, items: [{ label: '📋 Open Dashboard', link: '/dashboard', primary: true }] }];
  }
  if (intentId === 'go_events') {
    return [{ type: MSG.TEXT, content: 'Here you go!' }, { type: MSG.ACTION_LIST, items: [{ label: '📅 Browse all events', link: '/events', primary: true }] }];
  }
  if (intentId === 'go_profile') {
    if (!user) return requireLogin('access settings');
    return [{ type: MSG.TEXT, content: 'Opening your settings.' }, { type: MSG.ACTION_LIST, items: [{ label: '⚙️ Profile Settings', link: '/profile', primary: true }] }];
  }
  if (intentId === 'go_admin') {
    if (!user || user.role !== 'admin') return [{ type: MSG.TEXT, content: 'Admin Panel is only accessible to administrators.' }];
    return [{ type: MSG.TEXT, content: 'Opening Admin Panel.' }, { type: MSG.ACTION_LIST, items: [{ label: '🛡️ Admin Panel', link: '/admin', primary: true }] }];
  }

  // ── Unknown ───────────────────────────────────────────────────────────────
  return [
    { type: MSG.TEXT, content: `I'm not sure I understood that. Here are some things I can help you with:` },
    helpChips(user),
  ];
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function requireLogin(action) {
  return [
    { type: MSG.TEXT, content: `You need to be signed in to ${action}. Create a free account or sign in!` },
    { type: MSG.ACTION_LIST, items: [
      { label: '🔑 Sign In',   link: '/login'  },
      { label: '✨ Sign Up',   link: '/signup' },
    ]},
  ];
}

function categorySuggest() {
  return { type: MSG.QUICK_CHIPS, chips: [
    { label: '🎵 Music',       intent: 'music events'       },
    { label: '💻 Technology',  intent: 'technology events'  },
    { label: '🍽️ Food',        intent: 'food events'        },
    { label: '⚽ Sports',      intent: 'sports events'      },
    { label: '🎨 Arts',        intent: 'arts events'        },
    { label: '💼 Business',    intent: 'business events'    },
    { label: '🧘 Health',      intent: 'health events'      },
  ]};
}

function cheapEventsResponse(upcoming) {
  const cheap = [...upcoming].sort((a, b) => a.price - b.price).slice(0, 5);
  return [
    { type: MSG.TEXT, content: `💵 Most affordable upcoming events:` },
    { type: MSG.EVENT_LIST, events: cheap },
  ];
}

function helpChips(user) {
  const chips = user ? [
    { label: '🎫 My bookings',       intent: 'show my bookings'    },
    { label: '❤️ My wishlist',        intent: 'show my wishlist'    },
    { label: '💡 Recommend events',   intent: 'recommend events'    },
    { label: '💰 My spending',        intent: 'how much have I spent' },
    { label: '📅 Browse events',      intent: 'find events'         },
    { label: '❌ Cancel booking',     intent: 'how do I cancel'     },
  ] : [
    { label: '📅 Browse events',      intent: 'find events'         },
    { label: '⭐ Featured events',    intent: 'featured events'     },
    { label: '📖 How to book',        intent: 'how to book a ticket' },
    { label: '💵 Ticket prices',      intent: 'ticket prices'       },
    { label: '⭐ VIP tickets',        intent: 'VIP info'            },
    { label: '🎟️ About e-tickets',    intent: 'qr ticket'           },
  ];
  return { type: MSG.QUICK_CHIPS, chips };
}
