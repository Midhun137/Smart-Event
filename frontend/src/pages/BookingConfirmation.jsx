import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, Ticket, Calendar, MapPin, Download, 
  Share2, Award, QrCode, ShieldCheck, ArrowRight, Home, Printer, Loader2 
} from 'lucide-react';
import { getBookingById } from '../services/api';

const money = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const BookingConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();

  const [bookingData, setBookingData] = useState(location.state?.booking || null);
  const [tickets, setTickets] = useState(location.state?.tickets || []);
  const [event, setEvent] = useState(location.state?.event || null);
  const [txnRef, setTxnRef] = useState(location.state?.transaction_reference || '');
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState('');

  // If page was refreshed or loaded via direct link, fetch persistent booking from database
  useEffect(() => {
    if (!bookingData && id) {
      setLoading(true);
      getBookingById(id)
        .then((res) => {
          const b = res.data?.booking;
          if (b) {
            setBookingData(b);
            setTickets(b.tickets || []);
            setTxnRef(b.transaction_reference || `TXN-${b.booking_code}`);
            setEvent({
              title: b.event_title,
              start_time: b.start_time,
              venue_name: b.venue_name,
              venue_city: b.venue_city,
              banner_url: b.banner_url
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to retrieve persistent booking:', err);
          setError('Could not retrieve booking details. Please verify your booking ID or check "My Bookings".');
          setLoading(false);
        });
    }
  }, [id, bookingData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
        <p className="text-slate-400 text-xs font-semibold">Loading persistent ticket details from database...</p>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center">
          <Ticket className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Booking Record</h2>
          <p className="text-slate-400 text-xs mb-6">{error || 'Booking details not found.'}</p>
          <Link to="/my-bookings" className="inline-block bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs">
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const bookingCode = bookingData.booking_code || `BK-${bookingData.booking_id}`;
  const totalAmount = bookingData.net_amount || bookingData.total_amount || 0;
  const xpEarned = (tickets.length || 1) * 50;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-20 pt-10 selection:bg-cyan-500 selection:text-white">
      
      {/* Top Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-950/40">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Booking Confirmed & Seats Locked 🎉
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
          Your reservation is permanently written to the MySQL database. Present your digital QR pass at the entrance gate.
        </p>

        {/* XP Badge */}
        <div className="mt-4 inline-flex items-center gap-2 bg-amber-950/60 border border-amber-600/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold">
          <Award className="w-4 h-4 text-amber-400" />
          <span>+{xpEarned} SmartEvent XP awarded to your loyalty profile!</span>
        </div>
      </div>

      {/* Main Digital Pass Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
          
          {/* Header Banner */}
          <div className="h-44 bg-slate-950 relative overflow-hidden">
            <img 
              src={event?.banner_url || 'https://images.unsplash.com/photo-1540039155732-d674147f87a3?auto=format&fit=crop&w=1200&q=80'} 
              alt={event?.title || 'Event'} 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            
            <div className="absolute top-4 right-4">
              <span className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border border-emerald-400/40">
                Confirmed • {tickets.length} Ticket{tickets.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="absolute -bottom-5 left-6 w-14 h-14 bg-gradient-to-tr from-violet-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-900">
              <Ticket className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Pass Body */}
          <div className="p-6 sm:p-8 pt-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-800">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{event?.title || 'SmartEvent Experience'}</h2>
                <p className="text-xs font-mono text-cyan-400 mt-1">
                  Booking Code: <strong className="font-bold">{bookingCode}</strong>
                </p>
                <p className="text-xs font-mono text-slate-500">
                  Transaction Ref: {txnRef}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>InnoDB Locked</span>
                </span>
                <span className="block text-lg font-black text-white mt-2">
                  {money(totalAmount)}
                </span>
              </div>
            </div>

            {/* Performance Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Date & Showtime</p>
                <p className="font-bold text-white mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  {event?.start_time ? new Date(event.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nov 2026'}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Venue & Gate</p>
                <p className="font-bold text-white mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {event?.venue_name || 'Main Auditorium'}, {event?.venue_city || 'City'}
                </p>
              </div>
            </div>

            {/* Issued Tickets List with QR Codes */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Issued Digital Entry Passes ({tickets.length})
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tickets.map((t, idx) => (
                  <div 
                    key={t.ticket_code || idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-black text-violet-400 block">
                        {t.section || 'General'} · Row {t.row_label || 'A'} Seat {t.seat_number || idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200 block mt-0.5">
                        {t.ticket_code}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Status: {t.status || 'VALID'}
                      </span>
                    </div>

                    {/* QR Code Graphic Indicator */}
                    <div className="w-12 h-12 bg-white p-1 rounded-xl flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-10 h-10 text-slate-950" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handlePrint}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Print / Download Tickets</span>
              </button>

              <Link
                to="/my-bookings"
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-md shadow-violet-700/20"
              >
                <span>View in My Bookings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirmation;
