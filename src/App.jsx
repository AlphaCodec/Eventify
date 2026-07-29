import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Providers
import { ThemeProvider }         from './context/ThemeContext';
import { AuthProvider }          from './context/AuthContext';
import { EventProvider }         from './context/EventContext';
import { BookingProvider }       from './context/BookingContext';
import { WishlistProvider }      from './context/WishlistContext';
import { NotificationsProvider } from './context/NotificationsContext';

// Layout
import Navbar         from './components/Navbar';
import Footer         from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBot        from './components/ChatBot';

// Public Pages
import Home         from './pages/Home';
import Events       from './pages/Events';
import EventDetails from './pages/EventDetails';
import NotFound     from './pages/NotFound';

// Auth Pages
import Login         from './pages/Login';
import Signup        from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import AuthCallback   from './pages/AuthCallback';

// Protected Pages
import Dashboard  from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import Wishlist   from './pages/Wishlist';
import Profile    from './pages/Profile';

// Admin
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <EventProvider>
        <BookingProvider>
          <WishlistProvider>
            <NotificationsProvider>
              <Router>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      {/* Public */}
                      <Route path="/"              element={<Home />} />
                      <Route path="/events"        element={<Events />} />
                      <Route path="/events/:id"    element={<EventDetails />} />

                      {/* Auth */}
                      <Route path="/login"          element={<Login />} />
                      <Route path="/signup"         element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/auth/reset-password" element={<ResetPassword />} />
                      <Route path="/auth/callback"   element={<AuthCallback />} />

                      {/* Protected */}
                      <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/wishlist"     element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                      <Route path="/create-event/:editId" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />

                      {/* Admin */}
                      <Route path="/admin" element={
                        <ProtectedRoute adminOnly>
                          <AdminPanel />
                        </ProtectedRoute>
                      } />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>

                {/* Global AI Chatbot — available on every page */}
                <ChatBot />

                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      borderRadius: '12px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                    },
                  }}
                />
              </Router>
            </NotificationsProvider>
          </WishlistProvider>
        </BookingProvider>
      </EventProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
