import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Logout",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0ea5e9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout"
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/');
        Swal.fire({
          title: "Logged Out!",
          text: "You have been successfully logged out.",
          icon: "success",
          confirmButtonColor: "#0ea5e9"
        });
      }
    });
  };

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-neutral-900">Eventify</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/events" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Events
            </Link>
            <Link to="/create-event" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Create Event
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-1">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                  <span className="text-sm font-medium text-neutral-700">{user.name}</span>
                  <button onClick={handleLogout} className="text-neutral-600 hover:text-red-600 transition-colors">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-neutral-700">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="px-6 py-4 space-y-3">
            <Link to="/events" className="block text-neutral-700 hover:text-primary-600 font-medium py-2">
              Events
            </Link>
            <Link to="/create-event" className="block text-neutral-700 hover:text-primary-600 font-medium py-2">
              Create Event
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block text-neutral-700 hover:text-primary-600 font-medium py-2">
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" className="block text-neutral-700 hover:text-primary-600 font-medium py-2">
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left text-red-600 font-medium py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-neutral-700 hover:text-primary-600 font-medium py-2">
                  Login
                </Link>
                <Link to="/signup" className="block bg-primary-600 text-white px-6 py-2 rounded-lg text-center font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
