import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Ticket, Calendar, MapPin, QrCode, CheckCircle2, 
  XCircle, Clock, ArrowRight, Loader2, CreditCard, 
  Download, ShieldCheck, AlertCircle, RefreshCw, Sparkles, Printer 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, cancelBooking, validateTicket } from '../services/api';

const money = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchUserBookings = () => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserBookings(user.user_id)
      .then((res) => {
        setBookings(res.data?.bookings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load user bookings:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking? Your reserved seats will become available to other guests.")) {
      return;
    }

    setCancellingId(bookingId);
    setActionMessage('');

    try {
      const res = await cancelBooking(bookingId);
      setActionMessage(res.data?.message || "Your booking has been cancelled and seats released.");
      fetchUserBookings();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSimulateScan = async (ticketCode) => {
    try {
      const res = await validateTicket({
        ticket_code: ticketCode,
        gate: 'Gate 1 (Main Concourse)'
      });
      setScanResult(res.data);
      fetchUserBookings();
    } catch (err) {
      setScanResult({
        valid: false,
        message: err.response?.data?.message || err.response?.data?.error || "Validation failed"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <Ticket className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Please Sign In</h2>
          <p className="text-slate-400 text-xs mb-6">Sign in to view your confirmed tickets and digital QR entry passes.</p>
          <Link to="/login" className="inline-block bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs">
            Sign In to SmartEvent
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-24 selection:bg-cyan-500 selection:text-white">
      
      {/* Concourse Header */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-cyan-400" />
              <span>My Tickets & Bookings</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Active admissions, digital gate passes, and booking receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUserBookings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh</span>
            </button>
            <Link
              to="/events"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs font-bold transition shadow-md shadow-violet-700/20"
            >
              Book More Events
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Action Message Alert */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/50 text-emerald-200 text-xs flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="text-slate-400 hover:text-white font-bold">×</button>
          </div>
        )}

        {/* Scan Result Modal / Alert */}
        {scanResult && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            scanResult.valid
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {scanResult.valid ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
              <div>
                <strong>Gate Validation Result:</strong> {scanResult.message}
              </div>
            </div>
            <button onClick={() => setScanResult(null)} className="font-bold px-2">✕</button>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 space-y-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">Loading your bookings from database...</p>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Bookings Yet</h3>
            <p className="text-xs text-slate-400 mb-6">
              You haven't reserved any tickets yet. Explore movies and concerts with 3D seat previews!
            </p>
            <Link
              to="/events"
              className="inline-block bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-violet-700/20"
            >
              Browse Events
            </Link>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="space-y-6">
            {bookings.map((b) => {
              const isCancelled = b.status === 'CANCELLED';
              const ticketsList = b.tickets || [];

              return (
                <div 
                  key={b.booking_id}
                  className={`bg-slate-900 rounded-3xl border ${
                    isCancelled ? 'border-slate-800/50 opacity-60' : 'border-slate-800'
                  } overflow-hidden shadow-xl`}
                >
                  {/* Card Header */}
                  <div className="p-6 bg-slate-950/50 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {b.booking_code}
                        </span>
                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                          isCancelled 
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800' 
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                        {b.event_title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">
                        {money(b.net_amount || b.total_amount)}
                      </span>
                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelBooking(b.booking_id)}
                          disabled={cancellingId === b.booking_id}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition disabled:opacity-50"
                        >
                          {cancellingId === b.booking_id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body & Tickets */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block">Venue & City</span>
                        <span className="font-semibold text-white mt-0.5 block">{b.venue_name}, {b.venue_city}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block">Performance Date</span>
                        <span className="font-semibold text-white mt-0.5 block">
                          {b.start_time ? new Date(b.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nov 2026'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block">Payment Ref</span>
                        <span className="font-mono text-slate-400 mt-0.5 block">{b.transaction_reference || 'PAID'}</span>
                      </div>
                    </div>

                    {/* Issued Tickets Cards */}
                    <div className="pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Digital Entry Passes ({ticketsList.length})
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {ticketsList.map((t) => (
                          <div 
                            key={t.ticket_code}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div>
                              <span className="text-[10px] uppercase font-bold text-violet-400 block">
                                Section {t.section} · Row {t.row_label} · Seat {t.seat_number}
                              </span>
                              <span className="text-xs font-mono font-bold text-white block mt-0.5">
                                {t.ticket_code}
                              </span>
                              <span className={`text-[10px] font-bold ${
                                t.status === 'VALID' ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                Pass Status: {t.status}
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                              <div className="w-12 h-12 bg-white p-1 rounded-xl flex items-center justify-center">
                                <QrCode className="w-10 h-10 text-slate-950" />
                              </div>

                              {t.status === 'VALID' && (
                                <button
                                  onClick={() => handleSimulateScan(t.ticket_code)}
                                  className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                                  title="Test Gate Check-in"
                                >
                                  Simulate Scan
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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

export default MyBookings;
