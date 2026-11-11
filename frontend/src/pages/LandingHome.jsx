import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, Search, Heart, MapPin, Calendar, 
  Flame, Award, Cpu, Music, Gamepad2, BookOpen, Briefcase, 
  Database, ShieldCheck, CheckCircle2, Ticket 
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function LandingHome({ events, onSelectEvent, setActiveTab }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const { addToast } = useToast();

  const toggleWishlist = (e, eventId) => {
    e.stopPropagation();
    if (wishlist.includes(eventId)) {
      setWishlist(wishlist.filter((id) => id !== eventId));
      addToast('Removed from wishlist', 'info');
    } else {
      setWishlist([...wishlist, eventId]);
      addToast('Added to your wishlist!', 'success');
    }
  };

  const categoriesVisual = [
    { name: 'Tech & AI', icon: Cpu, desc: 'Summits, AI Labs & Coding Sprints', gradient: 'from-indigo-600 to-cyan-600' },
    { name: 'Music & Concerts', icon: Music, desc: 'Live Arenas & Electronic Festivals', gradient: 'from-purple-600 to-pink-600' },
    { name: 'Gaming & Esports', icon: Gamepad2, desc: 'Global Championships & VR Expos', gradient: 'from-cyan-600 to-emerald-600' },
    { name: 'Workshops & Masterclasses', icon: BookOpen, desc: 'Hands-on Bootcamps & Architecture', gradient: 'from-amber-600 to-orange-600' },
    { name: 'Business & Startup', icon: Briefcase, desc: 'Founder Pitches & VC Expo', gradient: 'from-blue-600 to-indigo-600' }
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative rounded-3xl apple-glass-card p-8 sm:p-14 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Next-Gen Event Experience Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Discover events <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                worth experiencing.
              </span>
            </h1>

            <p className="text-neutral-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Find events that match your interests, budget and location — backed by instant seat reservation & smart crowd intelligence.
            </p>

            {/* Hero Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 max-w-xl">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search events, artists, venues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('events'); }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-full pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                />
              </div>

              <button
                onClick={() => setActiveTab('events')}
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm whitespace-nowrap shadow-lg apple-glow-blue transition-all transform hover:scale-[1.02]"
              >
                Search
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setActiveTab('events')}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg apple-glow-blue transition-all"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('recommendations')}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-blue-300 border border-neutral-700 font-semibold text-sm transition-all"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Get Recommendations</span>
              </button>
            </div>
          </div>

          {/* Hero Featured Visual Composition Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-4 shadow-2xl backdrop-blur-sm space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden">
                <img 
                  src={events[0]?.banner_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"} 
                  alt="Featured Event"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-bold text-cyan-300">
                  ★ 94% Compatibility Match
                </div>
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-xs font-mono text-white flex justify-between items-center">
                  <span>🔥 128 Bookings Today</span>
                  <span className="text-emerald-400 font-bold">Fast Selling</span>
                </div>
              </div>

              <div className="p-2 space-y-2">
                <div className="text-xs text-indigo-400 font-mono font-semibold uppercase tracking-wider">Featured Flagship Summit</div>
                <h3 className="text-lg font-bold text-white">{events[0]?.title || 'Global AI & Tech Summit 2026'}</h3>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
                  <span>📍 Bharat Mandapam, New Delhi</span>
                  <span className="text-emerald-400 font-bold">From ₹{events[0]?.min_price || 999}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. TRENDING NEAR YOU (Horizontal Cards) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Trending Near You</span>
            </h2>
            <p className="text-slate-400 text-xs font-mono">Popular experiences in Bengaluru, Mumbai, Chennai & New Delhi</p>
          </div>

          <button
            onClick={() => setActiveTab('events')}
            className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, 3).map((event) => {
            const isWishlisted = wishlist.includes(event.event_id);
            return (
              <div
                key={event.event_id}
                onClick={() => onSelectEvent(event)}
                className="group bg-slate-900/80 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 overflow-hidden cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.banner_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-semibold text-cyan-300">
                      {event.category_name}
                    </div>

                    <button
                      onClick={(e) => toggleWishlist(e, event.event_id)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                        isWishlisted 
                          ? 'bg-rose-500 text-white border-rose-400' 
                          : 'bg-slate-950/70 text-slate-300 border-slate-700 hover:text-rose-400'
                      }`}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-indigo-600 text-xs font-bold text-white shadow">
                      From ₹{event.min_price}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-1 pt-2 border-t border-slate-800 text-xs text-slate-400 font-mono">
                      <div className="flex justify-between items-center">
                        <span>📍 {event.venue_city}</span>
                        <span className="text-emerald-400 font-semibold">{event.total_tickets_available} Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="w-full py-2.5 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors">
                    <span>Reserve Tickets</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. RECOMMENDED FOR YOU (Compatibility Score Engine) */}
      <section className="bg-slate-900/60 rounded-3xl border border-indigo-900/40 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Recommended For You</span>
            </h2>
            <p className="text-slate-400 text-xs font-mono">
              Tailored matching based on your preference profile & interests
            </p>
          </div>

          <button
            onClick={() => setActiveTab('recommendations')}
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-all"
          >
            View Full Recommendations Matrix
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.slice(0, 2).map((event, idx) => (
            <div
              key={event.event_id}
              onClick={() => onSelectEvent(event)}
              className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4 cursor-pointer hover:border-indigo-500/50 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] uppercase font-mono font-bold">
                    {idx === 0 ? '94% Match' : '90% Match'}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {event.title}
                  </h3>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-slate-500">Starting</div>
                  <div className="text-base font-extrabold text-emerald-400">₹{event.min_price}</div>
                </div>
              </div>

              <div className="text-xs text-indigo-300 font-mono flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{idx === 0 ? 'Recommended because you enjoy Tech & AI summits' : 'Matches your budget & location preference'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BROWSE BY CATEGORY */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
          <p className="text-slate-400 text-xs font-mono">Find curated experiences by theme</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categoriesVisual.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                onClick={() => setActiveTab('events')}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3 cursor-pointer hover:border-indigo-500/50 hover:scale-[1.03] transition-all group text-center flex flex-col items-center"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.gradient} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{cat.name}</div>
                <div className="text-[11px] text-slate-500 leading-tight">{cat.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. REWARDS TEASER SECTION */}
      <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 rounded-3xl border border-indigo-900/50 p-8 sm:p-10 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>SmartEvent Rewards System</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Earn points while you explore</h2>
            <p className="text-slate-300 text-sm max-w-lg">
              Take event quizzes, participate in predictions, earn loyalty badges, and redeem 15%–30% discount promo codes!
            </p>
          </div>

          <button
            onClick={() => setActiveTab('gamification')}
            className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm whitespace-nowrap shadow-lg shadow-amber-500/20 transition-all"
          >
            Play Trivia & Redeem Rewards
          </button>
        </div>
      </section>

    </div>
  );
}
