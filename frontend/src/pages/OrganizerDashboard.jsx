import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Ticket, Users, TrendingUp, AlertTriangle, 
  CheckCircle2, Sparkles, LayoutDashboard, Database, ArrowUpRight, Flame, ShieldAlert 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, AreaChart, Area 
} from 'recharts';

export default function OrganizerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/analytics/organizer/2')
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-24 text-slate-400 font-mono">Loading Analytics Data...</div>;
  }

  const { kpis, event_analytics, category_rankings, velocity_trends, actionable_recommendations } = data;

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-black text-white tracking-tight">Organizer Analytics Dashboard</h1>
              <span className="px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] font-mono font-bold uppercase">
                Real-Time Operations
              </span>
            </div>
            <p className="text-slate-400 text-xs font-mono mt-1">
              Real-time Revenue, Seat Occupancy, & Ticket Velocity Metrics
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{kpis?.total_revenue.toFixed(2)}</div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12.4% vs last month</span>
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Tickets Sold</span>
            <Ticket className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{kpis?.total_tickets_sold}</div>
          <div className="text-[10px] font-mono text-indigo-400">{kpis?.total_bookings} Total Reservations</div>
        </div>

        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Seat Occupancy</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">{kpis?.occupancy_rate_percent}%</div>
          <div className="text-[10px] font-mono text-cyan-400">{kpis?.attendance_rate_percent}% Gate Check-in Rate</div>
        </div>

        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Booking Velocity</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">+32%</div>
          <div className="text-[10px] font-mono text-slate-400">Avg Customer Spend: ₹{kpis?.avg_customer_spend}</div>
        </div>

      </div>

      {/* AI & Smart Insights Box */}
      <div className="bg-slate-900/90 rounded-3xl border border-indigo-900/50 p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>AI & Operations Actionable Insights</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>🔥 Event Trending</span>
            </div>
            <div className="text-slate-300">Booking velocity increased 32% over past 48 hours. High momentum!</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-1">
            <div className="font-bold text-rose-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>⚠️ Low Occupancy Notice</span>
            </div>
            <div className="text-slate-300">Cyberpunk Championship is at 48% seats. Suggested action: Launch 20% promo code.</div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>VIP Ticket Demand High</span>
            </div>
            <div className="text-slate-300">VIP passes selling 2.4× faster than standard passes. Re-allocate 10 executive seats to VIP.</div>
          </div>
        </div>
      </div>

      {/* Dynamic Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Revenue Bar Chart */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">Revenue by Event Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category_rankings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category_name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="total_revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Velocity Trends Area Chart */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">Daily Booking Velocity Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocity_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="booking_date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="daily_tickets_sold" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
