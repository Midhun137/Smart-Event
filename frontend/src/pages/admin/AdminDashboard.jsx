import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Calendar, DollarSign, Activity, Ticket, 
  Database, PlusCircle, CheckCircle2, AlertCircle, MapPin, 
  Clock, ShieldAlert, Sparkles, Building, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getEvents, createEvent, getOrganizerAnalytics } from '../../services/api';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [dbEvents, setDbEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Add Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    category_name: 'Concerts',
    venue_name: '',
    venue_city: '',
    venue_address: '',
    venue_capacity: 500,
    vip_price: 1999.00,
    base_price: 699.00,
    start_time: '2026-11-25 19:00:00',
    end_time: '2026-11-25 23:00:00',
    banner_url: 'https://images.unsplash.com/photo-1540039155732-d674147f87a3?auto=format&fit=crop&w=1200&q=80'
  });

  const bannerPresets = [
    { label: 'Concert', url: 'https://images.unsplash.com/photo-1540039155732-d674147f87a3?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Tech Summit', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Esports Arena', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Symphony', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Comedy', url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80' }
  ];

  const fetchEvents = () => {
    setLoadingEvents(true);
    getEvents()
      .then(res => {
        setDbEvents(res.data?.events || []);
        setLoadingEvents(false);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        setLoadingEvents(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await createEvent(newEvent);
      const data = res.data;

      setSuccessMessage(`Success! Event "${data.event?.title}" has been saved to the database with ${data.total_seats_generated || 40} seats generated!`);
      setShowAddEvent(false);
      // Reset form
      setNewEvent({
        title: '',
        description: '',
        category_name: 'Concerts',
        venue_name: '',
        venue_city: '',
        venue_address: '',
        venue_capacity: 500,
        vip_price: 150.00,
        base_price: 50.00,
        start_time: '2026-11-25 19:00:00',
        end_time: '2026-11-25 23:00:00',
        banner_url: 'https://images.unsplash.com/photo-1540039155732-d674147f87a3?auto=format&fit=crop&w=1200&q=80'
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to create event in database.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Mock visual charts data
  const revenueData = [
    { name: 'Jan', revenue: 4000, bookings: 240 },
    { name: 'Feb', revenue: 3000, bookings: 139 },
    { name: 'Mar', revenue: 5500, bookings: 380 },
    { name: 'Apr', revenue: 4500, bookings: 290 },
    { name: 'May', revenue: 7000, bookings: 480 },
    { name: 'Jun', revenue: 8500, bookings: 610 },
  ];

  const categoryData = [
    { name: 'Concerts', value: 45, fill: '#3b82f6' },
    { name: 'Sports', value: 25, fill: '#10b981' },
    { name: 'Comedy', value: 15, fill: '#f59e0b' },
    { name: 'Workshops', value: 10, fill: '#6366f1' },
    { name: 'Technology', value: 5, fill: '#ec4899' },
  ];

  const StatCard = ({ title, value, icon, trend, positive }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
          {icon}
        </div>
        <span className={`flex items-center text-sm font-bold ${positive ? 'text-emerald-600' : 'text-gray-500'}`}>
          {trend} {positive && <TrendingUp className="w-4 h-4 ml-1" />}
        </span>
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Top Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                <Database className="w-4 h-4" /> Database Admin Portal
              </div>
              <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                Admin Management & Operations
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Create new events with location & price details, monitor live seat statuses, and audit database bookings
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowAddEvent(!showAddEvent);
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
              >
                <PlusCircle className="w-5 h-5" />
                {showAddEvent ? 'Close Event Form' : '+ Add New Event'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alerts */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl flex items-center gap-3 mb-8 shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-2xl flex items-center gap-3 mb-8 shadow-sm">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Add Event Form Section */}
        {showAddEvent && (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-blue-100 mb-10 transition-all">
            <div className="border-b border-gray-100 pb-5 mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Admin Only Capability
              </div>
              <h3 className="text-2xl font-black text-slate-900">Add New Event to Database</h3>
              <p className="text-gray-500 text-sm mt-1">
                Provide event info, venue location details, and ticket price tiers. Seats will be automatically generated and linked to this event in MySQL.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-8">
              {/* Event Basic Info */}
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  1. Event Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Event Title *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Electric Daisy Carnival 2026"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newEvent.title} 
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      value={newEvent.category_name}
                      onChange={e => setNewEvent({...newEvent, category_name: e.target.value})}
                    >
                      <option value="Concerts">Concerts</option>
                      <option value="Technology">Technology</option>
                      <option value="Sports">Sports</option>
                      <option value="Workshops">Workshops</option>
                      <option value="Comedy">Comedy</option>
                      <option value="Movies">Movies</option>
                      <option value="College Events">College Events</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea 
                      required 
                      rows="3" 
                      placeholder="Describe the experience, performers, special perks, or schedule..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newEvent.description} 
                      onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Time (YYYY-MM-DD HH:MM:SS) *</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
                      value={newEvent.start_time} 
                      onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} 
                      placeholder="2026-11-25 19:00:00" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">End Time (YYYY-MM-DD HH:MM:SS) *</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
                      value={newEvent.end_time} 
                      onChange={e => setNewEvent({...newEvent, end_time: e.target.value})} 
                      placeholder="2026-11-25 23:00:00" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Banner Image URL</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs" 
                      value={newEvent.banner_url} 
                      onChange={e => setNewEvent({...newEvent, banner_url: e.target.value})} 
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Presets:</span>
                      {bannerPresets.map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewEvent({...newEvent, banner_url: preset.url})}
                          className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-2.5 py-1 rounded-lg transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  2. Location Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Venue / Arena Name *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Jawaharlal Nehru Indoor Stadium"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newEvent.venue_name} 
                      onChange={e => setNewEvent({...newEvent, venue_name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">City, State / Country *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Chennai, Tamil Nadu"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newEvent.venue_city} 
                      onChange={e => setNewEvent({...newEvent, venue_city: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Street Address *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Sydenhams Road, Periamet"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newEvent.venue_address} 
                      onChange={e => setNewEvent({...newEvent, venue_address: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Total Capacity</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newEvent.venue_capacity} 
                      onChange={e => setNewEvent({...newEvent, venue_capacity: Number(e.target.value)})} 
                    />
                  </div>
                </div>
              </div>

              {/* Price Details */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  3. Price & Ticket Tier Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">VIP Pass Tier (Rows A & B)</span>
                      <span className="text-xs bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded">Premium</span>
                    </div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">VIP Ticket Price (₹)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500" 
                      value={newEvent.vip_price} 
                      onChange={e => setNewEvent({...newEvent, vip_price: parseFloat(e.target.value)})} 
                    />
                    <p className="text-xs text-amber-700 mt-2">Applies to Front Rows with stage proximity and lounge access.</p>
                  </div>

                  <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">General Admission Tier (Rows C, D, E)</span>
                      <span className="text-xs bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">Standard</span>
                    </div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">General Ticket Base Price (₹)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-white border border-blue-300 rounded-xl px-4 py-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" 
                      value={newEvent.base_price} 
                      onChange={e => setNewEvent({...newEvent, base_price: parseFloat(e.target.value)})} 
                    />
                    <p className="text-xs text-blue-700 mt-2">Standard seating tier available to all attendees.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddEvent(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitLoading ? 'Saving to Database...' : 'Save & Publish Event to Database'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Database Events Management Section */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-slate-900">Database Events & Seat Inventories</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {dbEvents.length} Active Events
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">Live synchronized records directly from MySQL table `events` and `event_seats`.</p>
            </div>
            <button 
              onClick={fetchEvents}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              Refresh Records
            </button>
          </div>

          {loadingEvents ? (
            <div className="py-12 text-center text-gray-400">Loading events from database...</div>
          ) : dbEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No events found in database. Click "+ Add New Event" above to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase font-bold tracking-wider">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Event Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Location / Venue</th>
                    <th className="pb-3">Price Range</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dbEvents.map(ev => (
                    <tr key={ev.event_id} className="hover:bg-blue-50/40 transition">
                      <td className="py-4 font-mono font-bold text-slate-400">#{ev.event_id}</td>
                      <td className="py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img 
                            src={ev.banner_url || 'https://images.unsplash.com/photo-1540039155732-d674147f87a3?auto=format&fit=crop&w=100&q=80'} 
                            alt={ev.title} 
                            className="w-10 h-10 rounded-lg object-cover" 
                          />
                          <div>
                            <div>{ev.title}</div>
                            <span className="text-xs text-emerald-600 font-semibold">{ev.status || 'published'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {ev.category_name}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-slate-800">{ev.venue_name}</div>
                        <div className="text-xs text-gray-500">{ev.venue_city}</div>
                      </td>
                      <td className="py-4 font-mono font-bold text-slate-800">
                        ₹{ev.min_price} - ₹{ev.max_price}
                      </td>
                      <td className="py-4 text-xs text-gray-500 font-mono">
                        {ev.start_time?.slice(0, 16)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/events/${ev.event_id}/seats`}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Lock className="w-3.5 h-3.5" /> View Seat Map
                          </Link>
                          <Link 
                            to={`/events/${ev.event_id}`}
                            className="border border-gray-200 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Platform Revenue" value="$42,500" icon={<DollarSign className="w-6 h-6" />} trend="+14.5%" positive={true} />
          <StatCard title="Total Bookings" value="1,248" icon={<Ticket className="w-6 h-6" />} trend="+8.2%" positive={true} />
          <StatCard title="Active Users" value="4,850" icon={<Users className="w-6 h-6" />} trend="+12.1%" positive={true} />
          <StatCard title="Avg Attendance" value="88%" icon={<Activity className="w-6 h-6" />} trend="+2.4%" positive={true} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              Revenue Over Time 
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium uppercase tracking-wide">SQL Analytics</span>
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(value) => `$${value/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`$${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings Donut Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              Bookings by Category
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 mt-4">
              {categoryData.map(cat => (
                <div key={cat.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill }}></div>
                  <span className="text-gray-600 font-medium">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
