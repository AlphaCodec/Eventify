import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Users, Image, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Music',
    date: '',
    time: '',
    location: '',
    city: '',
    price: '',
    priceVip: '',
    capacity: '',
    description: '',
    imageUrl: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please login to create events",
        icon: "warning",
        confirmButtonColor: "#0ea5e9"
      }).then(() => {
        navigate('/login');
      });
      return;
    }

    const requiredFields = ['title', 'category', 'date', 'time', 'location', 'city', 'price', 'capacity', 'description'];
    const emptyFields = requiredFields.filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill in all required fields",
        icon: "warning",
        confirmButtonColor: "#0ea5e9"
      });
      return;
    }

    Swal.fire({
      title: "Event Created!",
      html: `
        <p>Your event has been successfully created.</p>
        <div class="mt-4 p-4 bg-neutral-50 rounded-lg">
          <p><strong>${formData.title}</strong></p>
          <p class="text-sm text-neutral-600 mt-2">${formData.date} • ${formData.city}</p>
        </div>
      `,
      icon: "success",
      confirmButtonColor: "#0ea5e9"
    }).then(() => {
      navigate('/events');
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Create New Event</h1>
          <p className="text-lg text-neutral-600">Share your event with the world</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Event Title *
                </div>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Summer Music Festival 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
              >
                <option value="Music">Music</option>
                <option value="Technology">Technology</option>
                <option value="Food">Food</option>
                <option value="Sports">Sports</option>
                <option value="Arts">Arts</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </div>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </div>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Central Park Amphitheater"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Standard Price *
                </div>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="49.99"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                VIP Price (Optional)
              </label>
              <input
                type="number"
                name="priceVip"
                value={formData.priceVip}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="149.99"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Capacity *
                </div>
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="5000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image URL (Optional)
                </div>
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Describe your event in detail..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Create Event
            </button>
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="px-8 py-4 border-2 border-neutral-300 rounded-xl hover:border-neutral-400 transition-colors font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;
