import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, User, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { getLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard()
      .then((res) => {
        setLeaderboard(res.data?.leaderboard || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load leaderboard:', err);
        setLoading(false);
      });
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="font-mono font-bold text-slate-400 w-5 text-center text-xs">#{rank}</span>;
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-24 selection:bg-cyan-500 selection:text-white">
      
      {/* Header Banner */}
      <div className="relative pt-12 pb-16 px-4 overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-violet-600 p-0.5 mx-auto mb-4 shadow-xl shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
            Global XP Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Meet the members making the most of every experience.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-20 space-y-6">
        
        {loading && (
          <div className="text-center py-20 space-y-3 bg-slate-900/60 rounded-3xl border border-slate-800">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">Loading the leaderboard…</p>
          </div>
        )}

        {!loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="w-12 text-center">Rank</span>
              <span className="flex-1 px-4">User & Loyalty Tier</span>
              <span className="text-right">Loyalty XP</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {leaderboard.length > 0 ? (
                leaderboard.map((item, idx) => {
                  const rank = item.global_rank || idx + 1;
                  const isCurrent = user?.user_id && item.user_id === user.user_id;

                  return (
                    <div 
                      key={item.user_id || idx}
                      className={`p-4 sm:p-5 flex items-center justify-between transition ${
                        isCurrent 
                          ? 'bg-violet-950/30 border-l-4 border-cyan-400' 
                          : 'hover:bg-slate-850/40'
                      }`}
                    >
                      <div className="w-12 flex justify-center items-center">
                        {getRankIcon(rank)}
                      </div>

                      <div className="flex-1 px-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                          {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{item.full_name || 'Member'}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.loyalty_level || 'Gold'} Member
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-cyan-400 font-mono">
                          {item.reward_points || 100} XP
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No leaderboard ranking records found.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Leaderboard;
