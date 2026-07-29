import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ArrowLeft, Save, X, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/eventsData';
import toast from 'react-hot-toast';

const EMPTY = {
  title:'', category:'Music', description:'', date:'', time:'18:00',
  location:'', city:'', image_url:'', price:'', price_vip:'',
  capacity:'', organizer:'', tags:'', status:'publish',
};

export default function CreateEvent() {
  const { editId }  = useParams();
  const navigate    = useNavigate();
  const { user, isAdmin, isOrganizer } = useAuth();
  const { createEvent, updateEvent, fetchEventById } = useEvents();

  const [form, setForm]         = useState(EMPTY);
  const [imageFile, setFile]    = useState(null);
  const [preview, setPreview]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [errors, setErrors]     = useState({});
  const fileRef = useRef();

  // Non-admin, non-organizer users cannot choose — they always go to pending
  const canPublishDirectly = isAdmin || isOrganizer;

  useEffect(() => {
    if (!editId) return;
    fetchEventById(editId).then(event => {
      if (!event) { toast.error('Event not found.'); navigate('/dashboard'); return; }
      if (event.created_by !== user?.id && !isAdmin) {
        toast.error('You can only edit your own events.');
        navigate('/dashboard'); return;
      }
      setForm({
        title: event.title||'', category: event.category||'Music',
        description: event.description||'', date: event.date||'',
        time: event.time?.slice(0,5)||'18:00', location: event.location||'',
        city: event.city||'', image_url: event.image_url||'',
        price: event.price||'', price_vip: event.price_vip||'',
        capacity: event.capacity||'', organizer: event.organizer||'',
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags||'',
        status: event.status || 'publish',
      });
      setPreview(event.image_url||'');
      setFetching(false);
    });
  }, [editId]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())    e.title    = 'Title is required.';
    if (!form.date)            e.date     = 'Date is required.';
    if (!form.location.trim()) e.location = 'Location is required.';
    if (!form.city.trim())     e.city     = 'City is required.';
    if (!form.price)           e.price    = 'Price is required.';
    if (!form.capacity)        e.capacity = 'Capacity is required.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { toast.error('Image must be under 5 MB.'); return; }
    setFile(file); setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors below.'); return; }
    setLoading(true);
    try {
      if (editId) {
        const submitStatus = form.status === 'draft' ? 'draft'
          : canPublishDirectly ? 'published'
          : 'pending';

        await updateEvent(editId, { ...form, status: submitStatus }, imageFile);

        if (submitStatus === 'pending') {
          // Was it a resubmission after rejection, or just an edit of an already-pending event?
          const wasRejected = form.status === 'rejected';
          toast.success(
            wasRejected
              ? '🔄 Event resubmitted for review! Admins have been notified.'
              : '🕐 Event updated and sent for admin review.'
          );
        } else if (submitStatus === 'draft') {
          toast.success('📝 Draft saved.');
        } else {
          toast.success('✅ Event updated successfully!');
        }
        navigate('/dashboard');
      } else {
        const { event, status } = await createEvent(form, user.id, imageFile, user.role);
        if (status === 'pending') {
          toast.success('🕐 Event submitted for review! You\'ll be notified once an admin approves it.');
        } else if (status === 'draft') {
          toast.success('📝 Event saved as draft.');
        } else {
          toast.success('🎉 Event published successfully!');
        }
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    }
    setLoading(false);
  };

  const set = (key, val) => {
    setForm(f => ({...f,[key]:val}));
    if (errors[key]) setErrors(e => ({...e,[key]:''}));
  };

  if (fetching) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  const submitLabel = () => {
    if (loading) return editId ? 'Submitting…' : 'Submitting…';
    if (form.status === 'draft') return 'Save as Draft';
    if (!canPublishDirectly) {
      if (form.status === 'rejected') return 'Resubmit for Approval';
      if (editId) return 'Update & Resubmit';
      return 'Submit for Approval';
    }
    return editId ? 'Update Event' : 'Publish Event';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white">
              {editId ? 'Edit Event' : 'Create New Event'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {editId ? 'Update your event details.' : 'Fill in the details to create your event.'}
            </p>
          </div>
        </div>

        {/* Approval notice for regular users */}
        {!canPublishDirectly && !editId && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 mb-6">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Events require admin approval</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm mt-0.5">
                Your event will be reviewed by an admin before going live. You'll receive a notification once it's approved or if any changes are needed.
              </p>
            </div>
          </motion.div>
        )}

        {/* Resubmission notice when editing a rejected event */}
        {!canPublishDirectly && editId && form.status === 'rejected' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-4 mb-6">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Resubmitting after rejection</p>
              <p className="text-blue-700 dark:text-blue-400 text-sm mt-0.5">
                Make your changes below and click <strong>Resubmit for Approval</strong>. Admins will be notified automatically.
              </p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Image Upload */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Event Cover Image</h3>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 rounded-xl overflow-hidden cursor-pointer transition-colors">
              {preview
                ? <div className="relative"><img src={preview} alt="Preview" className="w-full h-52 object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-medium text-sm">Click to change</p>
                    </div>
                  </div>
                : <div className="h-52 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
                    <Upload className="w-10 h-10" />
                    <p className="text-sm font-medium">Click to upload image (max 5 MB)</p>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <div className="mt-3">
              <label className="form-label">Or paste an image URL</label>
              <input type="url" value={form.image_url}
                onChange={e => { set('image_url', e.target.value); setPreview(e.target.value); }}
                placeholder="https://…" className="input-field text-sm" />
            </div>
          </div>

          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            <div>
              <label className="form-label">Event Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Summer Music Festival 2025" className={`input-field ${errors.title ? 'border-red-400' : ''}`} />
              {errors.title && <p className="error-message">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Category *</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
                  {CATEGORIES.filter(c => c !== 'All Events').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Status dropdown — only shown to admin/organizer */}
              {canPublishDirectly && (
                <div>
                  <label className="form-label">Publish Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                    <option value="publish">Publish immediately</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>
              )}
              {/* Regular users just see a read-only status pill */}
              {!canPublishDirectly && (
                <div>
                  <label className="form-label">Status after submission</label>
                  <div className="flex items-center gap-2 h-11">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl">
                      <Clock className="w-3.5 h-3.5" /> Pending Review
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={4} placeholder="Describe your event…" className="input-field resize-none" />
            </div>
            <div>
              <label className="form-label">Organizer Name</label>
              <input value={form.organizer} onChange={e => set('organizer', e.target.value)}
                placeholder="Your organization name" className="input-field" />
            </div>
            <div>
              <label className="form-label">Tags (comma separated)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="Music, Outdoor, Festival" className="input-field" />
            </div>
          </div>

          {/* Date & Location */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Date & Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date *</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                  className={`input-field ${errors.date ? 'border-red-400' : ''}`} />
                {errors.date && <p className="error-message">{errors.date}</p>}
              </div>
              <div>
                <label className="form-label">Time *</label>
                <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="form-label">Venue / Location *</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="Central Park Amphitheater" className={`input-field ${errors.location ? 'border-red-400' : ''}`} />
              {errors.location && <p className="error-message">{errors.location}</p>}
            </div>
            <div>
              <label className="form-label">City *</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="New York" className={`input-field ${errors.city ? 'border-red-400' : ''}`} />
              {errors.city && <p className="error-message">{errors.city}</p>}
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Pricing & Capacity</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Standard Price ($) *</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="49.99" className={`input-field ${errors.price ? 'border-red-400' : ''}`} />
                {errors.price && <p className="error-message">{errors.price}</p>}
              </div>
              <div>
                <label className="form-label">VIP Price ($)</label>
                <input type="number" min="0" step="0.01" value={form.price_vip} onChange={e => set('price_vip', e.target.value)}
                  placeholder="149.99" className="input-field" />
              </div>
              <div>
                <label className="form-label">Capacity *</label>
                <input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                  placeholder="500" className={`input-field ${errors.capacity ? 'border-red-400' : ''}`} />
                {errors.capacity && <p className="error-message">{errors.capacity}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2 shadow-glow disabled:opacity-60">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{submitLabel()}</>
                : <><Save className="w-4 h-4" />{submitLabel()}</>
              }
            </button>
            <Link to="/dashboard" className="btn-outline px-6 flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
