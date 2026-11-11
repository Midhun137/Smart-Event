import React, { useState, useEffect } from 'react';
import { User, Settings, CheckCircle2, Shield, Heart, DollarSign, MapPin, Ticket, Award, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updatePreferences } from '../services/api';

export default function UserProfile() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState('Tech, Music, Movies');
  const [budget, setBudget] = useState(5000);
  const [location, setLocation] = useState('Chennai, India');
  const [eventType, setEventType] = useState('In-Person');
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.user_id) return;
    setLoading(true);
    getProfile(currentUser.user_id)
      .then((res) => {
        const data = res.data;
        setProfile(data.user);
        if (data.preferences) {
          setCategories(data.preferences.preferred_categories || categories);
          setBudget(data.preferences.max_budget || budget);
          setLocation(data.preferences.preferred_location || location);
          setEventType(data.preferences.preferred_event_type || eventType);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setLoading(false);
      });
  }, [currentUser]);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    if (!currentUser?.user_id) return;
    setSaveStatus('Saving preferences to database...');
    updatePreferences(currentUser.user_id, {
      preferred_categories: categories,
      max_budget: budget,
      preferred_location: location,
      preferred_event_type: eventType
    })
      .then(() => {
        setSaveStatus('Preferences saved successfully! Event recommendation engine updated.');
        setTimeout(() => setSaveStatus(''), 4000);
      })
      .catch((err) => {
        setSaveStatus(err.response?.data?.error || 'Failed to update preferences.');
      });
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-20 pt-8 selection:bg-cyan-500 selection:text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg shadow-violet-500/20">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile?.full_name || currentUser?.full_name || 'SmartEvent User'}
                </h1>
                <p className="text-slate-400 text-xs font-mono mt-1">
                  {profile?.email || currentUser?.email || 'user@smartevent.io'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 text-xs uppercase font-bold tracking-wider">
                    Role: {profile?.role || currentUser?.role || 'User'}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/80 text-xs font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    {profile?.reward_points || currentUser?.reward_points || 100} XP ({profile?.loyalty_level || 'Gold'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'info' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Preferences & AI Profile</span>
            </button>
            <a
              href="/my-bookings"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-2 border border-slate-700"
            >
              <Ticket className="w-3.5 h-3.5 text-violet-400" />
              <span>Digital Passes & Bookings</span>
            </a>
          </div>
        </div>

        {/* Preferences Form */}
        {activeTab === 'info' && (
          <form onSubmit={handleSavePreferences} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 mb-1">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Recommendation & Matching Engine Preferences</span>
              </h2>
              <p className="text-slate-400 text-xs">
                These preferences configure the personalized ranking function in the recommendation engine.
              </p>
            </div>

            {saveStatus && (
              <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs font-semibold">
                {saveStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Preferred Categories (comma-separated)
                </label>
                <input
                  type="text"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Movies, Concerts, Technology"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Max Ticket Budget (₹)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Preferred City / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Chennai, Bengaluru, Mumbai"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Event Format Preference
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="In-Person">In-Person (Auditorium & Stadium)</option>
                  <option value="Virtual">Virtual / Stream</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-violet-700/20"
            >
              Save Preferences to MySQL
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
