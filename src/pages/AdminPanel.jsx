import React from 'react';
import { Users, Calendar, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { eventsData } from '../data/eventsData';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const totalRevenue = eventsData.reduce((sum, event) => sum + (event.attendees * event.price), 0);
  const totalAttendees = eventsData.reduce((sum, event) => sum + event.attendees, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-neutral-300">Manage events, users, and analytics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-600">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-1">Total Events</p>
            <p className="text-3xl font-bold text-neutral-900">{eventsData.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-accent-600">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-accent-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-accent-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-1">Total Attendees</p>
            <p className="text-3xl font-bold text-neutral-900">{totalAttendees.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-neutral-900">${totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-600">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-1">Growth Rate</p>
            <p className="text-3xl font-bold text-neutral-900">+24%</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Recent Events</h2>
            <div className="space-y-4">
              {eventsData.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={event.image} alt={event.title} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-semibold text-neutral-900">{event.title}</h3>
                      <p className="text-sm text-neutral-600">{event.category} • {event.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">${event.price}</p>
                    <p className="text-sm text-neutral-600">{event.attendees} attending</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Categories Performance</h2>
            <div className="space-y-4">
              {['Music', 'Technology', 'Food', 'Sports', 'Arts', 'Business'].map((category, index) => {
                const categoryEvents = eventsData.filter(e => e.category === category);
                const percentage = (categoryEvents.length / eventsData.length) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-700">{category}</span>
                      <span className="text-sm font-semibold text-neutral-900">{categoryEvents.length} events</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
