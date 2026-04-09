import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Users, Image, FileText, Tag, Clock, ArrowRight } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const swalConfig = { background: '#1e1e2e', color: '#f0f0fa', confirmButtonColor: '#7c5cfc' };

const Section = ({ title, children }) => (
  <div className="form-section" style={{ marginBottom: 20 }}>
    <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
      {title}
    </h3>
    {children}
  </div>
);

const Field = ({ label, icon: Icon, required, children }) => (
  <div>
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
      {Icon && <Icon size={13} color="var(--violet-light)" />} {label}
      {required && <span style={{ color: 'var(--violet-light)', marginLeft: 2 }}>*</span>}
    </label>
    {children}
  </div>
);

function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', category: 'Music', date: '', time: '',
    location: '', city: '', price: '', priceVip: '',
    capacity: '', description: '', image: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      Swal.fire({ ...swalConfig, title: 'Login Required', text: 'Please login to create events', icon: 'warning' })
        .then(() => navigate('/login'));
      return;
    }
    const required = ['title', 'category', 'date', 'time', 'location', 'city', 'price', 'capacity', 'description'];
    if (required.some((f) => !formData[f])) {
      Swal.fire({ ...swalConfig, title: 'Missing fields', text: 'Please fill in all required fields', icon: 'warning' });
      return;
    }
    setIsLoading(true);
    try {
      await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          priceVip: formData.priceVip ? parseFloat(formData.priceVip) : 0,
          capacity: parseInt(formData.capacity),
          organizer: user.name,
          attendees: 0,
        }),
      });
      Swal.fire({ ...swalConfig, title: 'Event Created! 🎉', text: `"${formData.title}" is now live.`, icon: 'success' })
        .then(() => navigate('/events'));
    } catch (err) {
      Swal.fire({ ...swalConfig, title: 'Error', text: err.message, icon: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '48px 0 40px', background: 'linear-gradient(135deg, rgba(124,92,252,0.08) 0%, transparent 60%)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Create</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: 8 }}>
              Host your event
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Share your experience with the world</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6" style={{ paddingTop: 40 }}>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
        >
          {/* Basic Info */}
          <Section title={<><FileText size={16} color="var(--violet-light)" /> Basic Information</>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Event Title" icon={FileText} required>
                <input type="text" name="title" value={formData.title} onChange={handleChange}
                  className="input-field" placeholder="e.g. Summer Music Festival 2025" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Category" icon={Tag} required>
                  <select name="category" value={formData.category} onChange={handleChange}
                    className="input-field" style={{ appearance: 'none', cursor: 'pointer' }}>
                    {['Music','Technology','Food','Sports','Arts','Business'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Image URL" icon={Image}>
                  <input type="url" name="image" value={formData.image} onChange={handleChange}
                    className="input-field" placeholder="https://images.unsplash.com/..." />
                </Field>
              </div>
            </div>
          </Section>

          {/* Date & Location */}
          <Section title={<><Calendar size={16} color="var(--violet-light)" /> Date & Location</>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Date" icon={Calendar} required>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" />
              </Field>
              <Field label="Time" icon={Clock} required>
                <input type="time" name="time" value={formData.time} onChange={handleChange} className="input-field" />
              </Field>
              <Field label="Venue / Address" icon={MapPin} required>
                <input type="text" name="location" value={formData.location} onChange={handleChange}
                  className="input-field" placeholder="Central Park Amphitheater" />
              </Field>
              <Field label="City" icon={MapPin} required>
                <input type="text" name="city" value={formData.city} onChange={handleChange}
                  className="input-field" placeholder="New York" />
              </Field>
            </div>
          </Section>

          {/* Tickets & Capacity */}
          <Section title={<><DollarSign size={16} color="var(--violet-light)" /> Tickets & Capacity</>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Field label="Standard Price ($)" icon={DollarSign} required>
                <input type="number" name="price" value={formData.price} onChange={handleChange}
                  className="input-field" placeholder="49.99" step="0.01" min="0" />
              </Field>
              <Field label="VIP Price ($)" icon={DollarSign}>
                <input type="number" name="priceVip" value={formData.priceVip} onChange={handleChange}
                  className="input-field" placeholder="149.99" step="0.01" min="0" />
              </Field>
              <Field label="Capacity" icon={Users} required>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange}
                  className="input-field" placeholder="500" min="1" />
              </Field>
            </div>
          </Section>

          {/* Description */}
          <Section title={<><FileText size={16} color="var(--violet-light)" /> Description</>}>
            <Field label="Tell attendees what to expect" required>
              <textarea
                name="description" value={formData.description} onChange={handleChange}
                rows={5} className="input-field" style={{ resize: 'vertical', minHeight: 120 }}
                placeholder="Describe your event in detail — what's happening, who it's for, what to bring..."
              />
            </Field>
          </Section>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button type="submit" className="btn-primary" disabled={isLoading}
              style={{ flex: 1, justifyContent: 'center', padding: '15px', fontSize: 16 }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Creating...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Publish Event <ArrowRight size={17} />
                </span>
              )}
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('/events')}
              style={{ padding: '15px 28px', fontSize: 16 }}>
              Cancel
            </button>
          </div>
        </motion.form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default CreateEvent;
