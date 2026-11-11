import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserRecommendations, getEvents } from '../services/api';
import { 
  Sparkles, MapPin, Calendar, Star, ChevronRight, 
  Loader2, Ticket, Film, Music, ArrowRight, Settings, Box 
} from 'lucide-react';

const money = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const Recommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const userId = user?.user_id || 1;

    getUserRecommendations(userId)
      .then((res) => {
        const data = res.data;
        setPreferences(data.user_preferences || {});
        let recs = data.recommendations || [];
        
        // If empty, fallback to fetching general events
        if (recs.length === 0) {
          getEvents().then((evRes) => {
            setRecommendations(evRes.data?.events || []);
            setLoading(false);
          }).catch(() => setLoading(false));
        } else {
          setRecommendations(recs);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load personalized recommendations:', err);
        // Fallback to general events
        getEvents()
          .then((evRes) => {
            setRecommendations(evRes.data?.events || []);
            setLoading(false);
          })
          .catch(() => {
            setError('Could not load recommendations.');
            setLoading(false);
          });
      });
  }, [user]);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-24 selection:bg-cyan-500 selection:text-white">
      
      {/* Cinematic Hero Header */}
      <div className="relative pt-12 pb-20 px-4 overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 mx-auto mb-4 shadow-xl shadow-violet-600/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cyan-400" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Personalized For You
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Algorithmically ranked using your category interests, budget preferences, and preferred city.
          </p>

          {/* Active Profile Traits */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Preferences:</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-300">
              Categories: {preferences?.preferred_categories || 'Movies, Concerts, Tech'}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-300">
              Budget: Up to {money(preferences?.max_budget || 5000)}
            </span>
            <Link 
              to="/profile" 
              className="text-xs font-bold px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 transition flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              <span>Edit Preferences</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-8">
        
        {loading && (
          <div className="text-center py-24 space-y-3 bg-slate-900/60 rounded-3xl border border-slate-800">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">Running database compatibility score algorithm...</p>
          </div>
        )}

        {!loading && recommendations.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xl">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">No custom recommendations yet</h3>
            <p className="text-xs text-slate-400 mb-6">Explore movies and concerts to refine your personalized matching score.</p>
            <Link
              to="/events"
              className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs font-bold transition shadow-md shadow-violet-700/20"
            >
              Discover All Events
            </Link>
          </div>
        )}

        {!loading && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec) => {
              const isMovie = /movie|cinema|film/i.test(rec.category_name || '');
              const isConcert = /concert|music/i.test(rec.category_name || '');
              const score = rec.compatibility_score || (isMovie ? 95 : isConcert ? 90 : 85);
              const isDemo = rec.description?.includes('[SmartEvent demo:');

              return (
                <div 
                  key={rec.event_id}
                  className="bg-slate-900/90 rounded-3xl overflow-hidden border border-slate-800/80 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-950/30 flex flex-col sm:flex-row group"
                >
                  {/* Poster Thumbnail */}
                  <div className="sm:w-2/5 h-60 sm:h-auto relative overflow-hidden bg-slate-950 flex-shrink-0">
                    <img 
                      src={rec.banner_url || 'https://images.unsplash.com/photo-1540039155732-d674147f87a3?auto=format&fit=crop&w=800&q=80'} 
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
                    
                    {/* Compatibility Match Badge */}
                    <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-cyan-500/40 flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-black text-cyan-300 text-xs">{score}% Match</span>
                    </div>

                    {isDemo && (
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-amber-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-600/40">
                          Demo Showcase
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
                          {isMovie && <Film className="w-3 h-3" />}
                          {isConcert && <Music className="w-3 h-3" />}
                          {rec.category_name}
                        </span>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          From {money(rec.min_price || 350)}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {rec.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {rec.description?.replace(/\[SmartEvent demo:[^\]]*\]\s*/i, '') || 'Specially selected live event fitting your preferred format and budget.'}
                      </p>

                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-cyan-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{rec.venue_name || 'Auditorium'}, {rec.venue_city || 'City'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{rec.start_time ? new Date(rec.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Nov 2026'}</span>
                      </div>

                      <Link
                        to={`/events/${rec.event_id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 px-3.5 py-2 rounded-xl transition shadow-md shadow-violet-700/20"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Book Seats</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Recommendations;
