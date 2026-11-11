import React, { useState, useEffect } from 'react';
import { PlusCircle, ShieldCheck, CheckCircle2, Calendar, MapPin } from 'lucide-react';

export default function AdminManagement() {
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/events/categories')
      .then((res) => res.json())
      .then((res) => setCategories(res.categories || []));

    fetch('http://127.0.0.1:5000/api/events/venues')
      .then((res) => res.json())
      .then((res) => setVenues(res.venues || []));
  }, []);

  const handleCreateEvent = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/events/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        category_id: categoryId || categories[0]?.category_id,
        venue_id: venueId || venues[0]?.venue_id,
        start_time: startTime || '2026-09-01T10:00:00',
        end_time: endTime || '2026-09-01T18:00:00',
        banner_url: bannerUrl
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setMsg(`Event created successfully! Title: ${data.event.title}`);
        setTitle('');
        setDescription('');
      });
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin & Event Creation Portal</h1>
            <p className="text-slate-400 text-xs font-mono">Create new events and auto-generate seat matrices</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Event Creation Form */}
      <form onSubmit={handleCreateEvent} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <span>Create New Event</span>
        </h2>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. NextGen AI Summit 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Event Description</label>
            <textarea
              rows={3}
              required
              placeholder="Provide a comprehensive event overview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Venue</label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>{v.name} ({v.city})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Banner Image URL</label>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30"
        >
          Publish Event & Initialize Ticket Tiers
        </button>
      </form>

    </div>
  );
}
