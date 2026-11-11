import React, { useState, useEffect } from 'react';
import { 
  Ticket, QrCode, Calendar, MapPin, AlertCircle, RefreshCw, 
  CheckCircle2, XCircle, ShieldCheck, ArrowRight 
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function MyTickets({ currentUser, setActiveTab }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validationResult, setValidationResult] = useState(null);
  const { addToast } = useToast();

  const fetchUserBookings = () => {
    setLoading(true);
    const userId = currentUser?.user_id || 1;
    fetch(`http://127.0.0.1:5000/api/bookings/user/${userId}`)
      .then((res) => res.json())
      .then((res) => {
        setBookings(res.bookings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUserBookings();
  }, [currentUser]);

  const handleCancelBooking = (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Stored procedure sp_cancel_booking will calculate your refund amount based on remaining event hours.')) return;

    fetch(`http://127.0.0.1:5000/api/bookings/cancel/${bookingId}`, {
      method: 'POST'
    })
      .then((res) => res.json())
      .then((data) => {
        addToast(data.message || 'Booking cancelled via Stored Procedure.', 'info');
        fetchUserBookings();
      })
      .catch((err) => addToast(`Cancellation failed: ${err.message}`, 'error'));
  };

  const handleValidateTicket = (ticketCode) => {
    fetch('http://127.0.0.1:5000/api/bookings/tickets/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_code: ticketCode, gate: 'Gate B (North Entrance)' })
    })
      .then((res) => res.json())
      .then((data) => {
        setValidationResult(data);
        fetchUserBookings();
      });
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-400 font-mono">Loading digital tickets...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-indigo-400" />
            <span>My Digital Tickets</span>
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1">
            Access QR codes, gate arrival guidance, or request stored-procedure refunds
          </p>
        </div>

        <button
          onClick={() => setActiveTab('events')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow"
        >
          <span>Book New Tickets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">You have no active bookings. Reserve your first event today!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((b) => (
            <div
              key={b.booking_id}
              className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl"
            >
              {/* Header Bar */}
              <div className="bg-slate-950 p-4 px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="space-x-3">
                  <span className="text-slate-400">Code:</span>
                  <span className="text-indigo-400 font-bold">{b.booking_code}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">Txn Ref:</span>
                  <span className="text-cyan-300">{b.transaction_reference || 'N/A'}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                    b.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {b.status}
                  </span>

                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(b.booking_id)}
                      className="px-3 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] font-semibold transition-colors"
                    >
                      Cancel Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Event & Tickets Grid */}
              <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{b.event_title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono mt-1">
                      <span>📍 {b.venue_name} ({b.venue_city})</span>
                      <span>📅 {new Date(b.start_time).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs text-slate-400">Total Net Amount</div>
                    <div className="text-lg font-bold text-emerald-400">₹{parseFloat(b.net_amount).toFixed(2)}</div>
                  </div>
                </div>

                {/* Tickets Sub-cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                  {b.tickets.map((t) => (
                    <div
                      key={t.ticket_id}
                      className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs text-slate-400 font-mono">Seat Section</div>
                          <div className="text-sm font-bold text-white">{t.section} — Row {t.row_label}{t.seat_number}</div>
                        </div>

                        <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                          <QrCode className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 text-center font-mono text-xs text-cyan-300 tracking-wider">
                        {t.ticket_code}
                      </div>

                      <div className="flex justify-between items-center text-xs font-mono pt-1">
                        <span className={`font-semibold ${
                          t.status === 'VALID' ? 'text-emerald-400' :
                          t.status === 'USED' ? 'text-cyan-400' : 'text-slate-500'
                        }`}>
                          Status: {t.status}
                        </span>

                        {t.status === 'VALID' && (
                          <button
                            onClick={() => handleValidateTicket(t.ticket_code)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-[10px] font-semibold border border-indigo-500/40"
                          >
                            Simulate Scanner
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Simulator Modal */}
      {validationResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-indigo-500/50 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              {validationResult.valid ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="text-lg font-bold text-white">Entrance Scanner Validation</h3>
                <p className="text-slate-400 text-xs font-mono">{validationResult.gate}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-300">{validationResult.message}</div>
              {validationResult.ticket && (
                <div className="text-cyan-400 pt-1">Attendee: {validationResult.ticket.full_name}</div>
              )}
            </div>

            <button
              onClick={() => setValidationResult(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Close Simulator
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
