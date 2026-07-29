# Eventify — Full-Stack Event Platform (Supabase Edition)

A production-ready event discovery and ticketing platform built with **React + Vite + Tailwind CSS**, fully migrated to **Supabase** for authentication, database, storage, and real-time features.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Supabase Setup](#supabase-setup)
5. [Local Development](#local-development)
6. [Environment Variables](#environment-variables)
7. [Database Schema](#database-schema)
8. [Authentication](#authentication)
9. [Storage Buckets](#storage-buckets)
10. [Real-time Features](#real-time-features)
11. [Role System](#role-system)
12. [Deployment](#deployment)
13. [First Admin Setup](#first-admin-setup)
14. [Seed Data](#seed-data)

---

## Feature Overview

### Public
| Feature | Details |
|---|---|
| Browse Events | Paginated grid/list, search, category filter, city filter, price slider |
| Event Detail | Full info, capacity bar, organiser info, Reviews tab, Details tab |
| Google OAuth | One-click sign-in via Google |
| Email/Password Auth | Sign-up with email confirmation, forgot password, secure reset |

### Authenticated Users
| Feature | Details |
|---|---|
| Book Tickets | Standard & VIP tickets, quantity selection, instant confirmation |
| QR E-Tickets | Each booking generates a scannable QR code ticket in-app |
| Dashboard | View all bookings, cancel bookings, total spend stats |
| Wishlist | Save / unsave events with heart button, real-time count in navbar |
| Notifications | Real-time bell icon with dropdown; auto-marks read on open |
| Profile Settings | Edit name, bio, phone; upload avatar to Supabase Storage |
| Write Reviews | Star rating + comment after attending a booked event |
| Create Events | Upload cover image to Storage, set price/VIP/capacity, draft/publish |

### Admin
| Feature | Details |
|---|---|
| Admin Panel | Stats overview, revenue charts, booking table, user management |
| User Role Management | Assign user / organiser / admin roles from the Users tab |
| Event Management | View, edit, delete, feature/unfeature any event |
| Revenue Analytics | Bar charts by category, pie chart of booking statuses |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Routing | React Router v6 |
| Backend / DB | Supabase (PostgreSQL + PostgREST) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Storage | Supabase Storage (event images + avatars) |
| Real-time | Supabase Realtime (notifications, event updates) |
| Animation | Framer Motion |
| Charts | Recharts |
| QR Codes | qrcode (canvas) |
| Toasts | react-hot-toast |
| Dialogs | SweetAlert2 |

---

## Project Structure

```
eventify-supabase/
├── .env.example                  ← Copy to .env.local
├── supabase/
│   └── migrations/
│       └── 001_init.sql          ← Run this in Supabase SQL Editor
├── src/
│   ├── lib/
│   │   └── supabase.js           ← Supabase client + storage helpers
│   ├── context/
│   │   ├── AuthContext.jsx       ← Auth: login, signup, Google, reset
│   │   ├── EventContext.jsx      ← Events CRUD + realtime
│   │   ├── BookingContext.jsx    ← Bookings + notifications
│   │   ├── WishlistContext.jsx   ← Wishlist (optimistic UI)
│   │   └── NotificationsContext.jsx ← Realtime notification bell
│   ├── services/
│   │   └── reviewService.js      ← Reviews CRUD
│   ├── components/
│   │   ├── Navbar.jsx            ← Sticky nav, notifications, avatar dropdown
│   │   ├── EventCard.jsx         ← Card with wishlist, capacity, pricing
│   │   ├── QRTicket.jsx          ← QR code e-ticket modal
│   │   ├── ReviewSection.jsx     ← Star ratings + review list
│   │   ├── ProtectedRoute.jsx
│   │   ├── EmptyState.jsx
│   │   ├── StatCard.jsx
│   │   └── Footer.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Events.jsx            ← Paginated, debounced search
│   │   ├── EventDetails.jsx      ← Async fetch, Reviews tab
│   │   ├── Login.jsx             ← Email + Google OAuth
│   │   ├── Signup.jsx            ← Email + Google OAuth + confirm screen
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── AuthCallback.jsx      ← OAuth redirect handler
│   │   ├── Dashboard.jsx         ← Bookings, QR tickets, wishlist, profile
│   │   ├── Profile.jsx           ← Account settings + avatar upload
│   │   ├── CreateEvent.jsx       ← Image upload, draft/publish
│   │   ├── Wishlist.jsx
│   │   ├── AdminPanel.jsx        ← Charts, events, bookings, users
│   │   └── NotFound.jsx
│   ├── data/
│   │   └── eventsData.js         ← CATEGORIES, SORT_OPTIONS constants
│   ├── hooks/
│   │   ├── useConfirm.js
│   │   └── useToast.js
│   └── utils/
│       ├── helpers.js
│       └── storage.js            ← Stub (no-op; was localStorage)
```

---

## Supabase Setup

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Enter a project name (e.g. `eventify`), choose a region close to your users, set a database password, and click **Create new project**.
4. Wait ~2 minutes for provisioning to complete.

### Step 2 — Run the Database Migration

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/001_init.sql` from this repo and paste the entire contents.
4. Click **Run** (▶).
5. You should see "Success. No rows returned." — all tables, policies, functions, triggers, and storage buckets are now created.

### Step 3 — Enable Google OAuth (optional but recommended)

1. Go to **Authentication → Providers** in your Supabase dashboard.
2. Find **Google** and toggle it **Enabled**.
3. Create a Google OAuth App:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorised redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Paste the Client ID and Client Secret into the Google provider form in Supabase.
5. Add your app URL to **Authentication → URL Configuration → Redirect URLs**:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
6. Click **Save**.

### Step 4 — Configure Email Auth

By default Supabase requires email confirmation. You can control this at:
- **Authentication → Settings → Email** → "Enable email confirmations" toggle.

For development, you can **disable** email confirmation so you can sign in immediately.
For production, leave it **enabled** — the app already handles the confirmation screen.

---

## Local Development

```bash
# 1. Clone / unzip the project
cd eventify-supabase

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key (see below)

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
```

**Where to find these values:**
- `VITE_SUPABASE_URL` → Supabase Dashboard → **Project Settings → API → Project URL**
- `VITE_SUPABASE_ANON_KEY` → Supabase Dashboard → **Project Settings → API → Project API keys → anon public**
- `VITE_APP_URL` → Your local dev URL (or your deployed domain in production)

> ⚠️ Never commit `.env.local` to version control. It is already in `.gitignore`.

---

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles; auto-created on sign-up via trigger. Extends `auth.users`. |
| `events` | All events with full details, pricing, capacity, tags, status |
| `bookings` | Ticket bookings; references profiles + events |
| `wishlist` | User ↔ Event many-to-many saves |
| `reviews` | Star ratings + comments per event per user |
| `notifications` | In-app notifications with real-time delivery |

### Row Level Security (RLS)

All tables have RLS enabled. The policies enforce:

- **Profiles**: Anyone can read; users can update their own; admins can update any.
- **Events**: Published events are public; authenticated users can create; owners/admins can edit/delete.
- **Bookings**: Users see only their own; admins see all.
- **Wishlist / Reviews**: Users manage their own entries only.
- **Notifications**: Users see only their own.

### Useful DB Functions

```sql
-- Atomically increment attendee count
SELECT increment_attendees('event-uuid', 2);

-- Atomically decrement attendee count
SELECT decrement_attendees('event-uuid', 2);
```

---

## Authentication

### Email / Password
- Sign up → confirmation email sent (if enabled) → click link → signed in.
- Forgot password → email with reset link → `/auth/reset-password` → new password set.

### Google OAuth
- Click "Continue with Google" → Supabase handles redirect → user lands at `/auth/callback` → redirected to home.
- On first sign-in, a profile row is auto-created via the `handle_new_user` trigger.

### Session Management
- Sessions are persisted in `localStorage` by the Supabase client and auto-refreshed.
- `AuthContext` listens to `onAuthStateChange` for all auth events.

---

## Storage Buckets

Two public buckets are created by the migration:

| Bucket | Used for | Path pattern |
|---|---|---|
| `event-images` | Event cover images | `{user_id}/{timestamp}.{ext}` |
| `avatars` | User profile photos | `{user_id}/avatar.{ext}` |

Both buckets are **public read** — no signed URLs needed to display images.
Write access requires authentication.

**File size limits (enforced client-side):**
- Event images: 5 MB max
- Avatars: 2 MB max

---

## Real-time Features

### Event Updates
`EventContext` subscribes to `postgres_changes` on the `events` table. Any insert, update, or delete refreshes the events list for all connected clients automatically.

### Notifications
`NotificationsContext` subscribes to `INSERT` events on the `notifications` table filtered to the current user. When a booking is confirmed, a notification row is inserted → the bell icon badge updates instantly.

**Notification types used:**
- `booking_confirmed` — triggered on every successful booking

---

## Role System

Three roles are available, set in the `profiles.role` column:

| Role | Access |
|---|---|
| `user` | Browse, book, wishlist, review, create events |
| `organiser` | Same as user + treated as trusted creator |
| `admin` | Full access including Admin Panel and user role management |

### Promote a User to Admin

After the first user signs up, run this in the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

### Change Roles via the UI

Admin users can change any user's role directly from the **Admin Panel → Users** tab using the role dropdown. Changes apply instantly.

---

## Deployment

### Vercel (recommended)

```bash
npm run build   # verify build passes locally first
```

1. Push your code to a GitHub repository.
2. Import the repo in [vercel.com](https://vercel.com).
3. Set environment variables in Vercel's dashboard (same as `.env.local`).
4. Change `VITE_APP_URL` to your Vercel deployment URL.
5. Deploy — Vercel auto-detects Vite.

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add the environment variables in Netlify's site settings.
4. Add a `_redirects` file in `public/`:
   ```
   /*  /index.html  200
   ```
   (This ensures React Router works on page refresh.)

### Update Supabase for Production

After deploying, update these in Supabase Dashboard:

1. **Authentication → URL Configuration → Site URL**: set to your production URL.
2. **Authentication → URL Configuration → Redirect URLs**: add `https://yourdomain.com/auth/callback`.
3. If using Google OAuth, update the Google Cloud Console redirect URI to `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (it should already be set correctly).

---

## First Admin Setup

1. Deploy the app (or run locally).
2. Sign up with the email you want as admin.
3. Confirm your email if email confirmation is enabled.
4. In Supabase SQL Editor, run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your@email.com';
   ```
5. Refresh the app — you will now see the Admin Panel link in the navbar dropdown.

---

## Seed Data

The original localStorage seed events (from `eventsData.js`) are **not automatically inserted** into Supabase. To seed sample events:

### Option A — Via SQL Editor

```sql
INSERT INTO public.events (title, category, description, date, time, location, city, image_url, price, price_vip, capacity, attendees, featured, organizer, tags, status, created_by)
VALUES
  ('Summer Music Festival 2025', 'Music',
   'Experience an unforgettable evening of live music featuring top artists from around the world.',
   '2025-07-15', '18:00', 'Central Park Amphitheater', 'New York',
   'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop',
   49.99, 149.99, 5000, 3456, true, 'LiveNation Events',
   ARRAY['Outdoor','Music','Festival','Live'], 'published', NULL),

  ('Tech Innovation Summit 2025', 'Technology',
   'Two days of cutting-edge technology discussions, workshops, and networking opportunities.',
   '2025-08-22', '09:00', 'Silicon Valley Convention Center', 'San Francisco',
   'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
   299.99, 599.99, 2000, 1234, true, 'TechCorp Global',
   ARRAY['Conference','Technology','Networking','AI'], 'published', NULL),

  ('Food & Wine Expo', 'Food',
   'Discover exquisite cuisines and premium wines from renowned chefs and vintners.',
   '2025-09-10', '12:00', 'Grand Exhibition Hall', 'Los Angeles',
   'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop',
   75.00, 195.00, 3000, 2100, false, 'Culinary Masters',
   ARRAY['Food','Wine','Tasting','Culinary'], 'published', NULL);
```

### Option B — Via the App

Sign in as an admin and use the **Create Event** page to add events through the UI. Images will be uploaded to Supabase Storage automatically.

---

## Common Issues

### "Missing Supabase environment variables" error
Make sure `.env.local` exists and contains both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart the dev server after creating it.

### Google OAuth shows "Error 400: redirect_uri_mismatch"
The redirect URI in Google Cloud Console must exactly match `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`. Check for trailing slashes.

### Notifications not appearing in real-time
Supabase Realtime must be enabled for the `notifications` table. In Supabase Dashboard → **Database → Replication**, make sure `notifications` is in the source tables list.

### Images not uploading
Confirm the storage buckets exist (Dashboard → **Storage**) and that their RLS policies allow authenticated writes. Re-run the migration SQL if needed.

### Users can't access the Admin Panel
Ensure their `profiles.role` is set to `'admin'` in the database. The column defaults to `'user'` for all new sign-ups.

---

## License

MIT — free for personal and commercial use.
