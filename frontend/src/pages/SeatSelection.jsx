import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Monitor, Ticket, Check, Lock, 
  MapPin, Loader2, Minus, Plus, Clock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEventById, holdSeats, releaseHold, createBooking } from '../services/api';
import './SeatSelection.css';

const Auditorium3D = lazy(() => import('../components/Auditorium3D'));

const money = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
const isAvailable = (seat) => seat.status === 'AVAILABLE';

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  
  // View states
  const [flat, setFlat] = useState(false);
  const [angle, setAngle] = useState(28);
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [review, setReview] = useState(false);

  // Hold state & countdown
  const [holdToken, setHoldToken] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  // Load event details and seats
  const fetchEventSeats = () => {
    setLoading(true);
    setError('');
    getEventById(id)
      .then(({ data }) => {
        setEvent(data.event);
        setSeats(data.seats || []);
      })
      .catch((err) => {
        console.error('Failed to load venue:', err);
        setError('We could not load this auditorium from the database. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEventSeats();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Clean up server-side hold on unmount if hold active
  useEffect(() => {
    return () => {
      if (selected.length > 0) {
        releaseHold({ event_seat_ids: selected }).catch(() => {});
      }
    };
  }, [selected]);

  // Handle Hold Countdown Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setNotice('Your 7-minute seat hold has expired. Seats have been returned to event inventory.');
      setHoldToken(null);
      setPriceBreakdown(null);
      setSelected([]);
      setReview(false);
      fetchEventSeats();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    if (seconds === null || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const chosen = seats.filter((s) => selected.includes(s.event_seat_id));
  const subtotal = chosen.reduce((sum, s) => sum + Number(s.price), 0);
  const convenienceFee = priceBreakdown ? priceBreakdown.convenience_fee : Math.round(subtotal * 0.05);
  const tax = priceBreakdown ? priceBreakdown.tax : Math.round((subtotal + convenienceFee) * 0.18);
  const total = priceBreakdown ? priceBreakdown.total : (subtotal + convenienceFee + tax);

  const rows = [...new Set(seats.map((s) => s.row_label))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const isConcert = /concert|music/i.test(event?.category_name || '');

  // Toggle seat selection
  const toggleSeat = (seat) => {
    if (!isAvailable(seat) || processing) return;
    setNotice('');
    setReview(false);

    if (selected.includes(seat.event_seat_id)) {
      const next = selected.filter((key) => key !== seat.event_seat_id);
      setSelected(next);
      if (next.length === 0 && holdToken) {
        releaseHold({ event_seat_ids: selected }).catch(() => {});
        setHoldToken(null);
        setPriceBreakdown(null);
        setTimeLeft(null);
      }
    } else if (selected.length >= 6) {
      setNotice('Maximum limit reached: You can select up to 6 seats per transaction.');
    } else {
      setSelected([...selected, seat.event_seat_id]);
    }
  };

  // Request temporary server hold before confirming checkout
  const initiateHold = async () => {
    if (selected.length === 0) return;
    setProcessing(true);
    setNotice('');

    try {
      const { data } = await holdSeats({
        event_id: Number(id),
        event_seat_ids: selected,
        hold_duration_seconds: 420 // 7 minutes
      });

      setHoldToken(data.hold_token);
      setPriceBreakdown(data.price_breakdown);
      setTimeLeft(data.countdown_seconds || 420);
      setReview(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'One or more selected seats were just claimed by another user.';
      setNotice(errMsg);
      setReview(false);
      // Refresh real-time seat availability
      fetchEventSeats();
    } finally {
      setProcessing(false);
    }
  };

  // Finalize booking transaction with database
  const completeBooking = async () => {
    if (!user?.user_id) {
      navigate('/login', { state: { from: { pathname: `/events/${id}/seats` } } });
      return;
    }

    setProcessing(true);
    setNotice('');

    try {
      const { data } = await createBooking({
        user_id: user.user_id,
        event_id: Number(id),
        event_seat_ids: selected,
        hold_token: holdToken,
        payment_method: 'Test Payment (Hosted Sandbox)'
      });

      // Clear local timer
      if (timerRef.current) clearInterval(timerRef.current);

      // Navigate to persistent confirmation page
      navigate(`/booking/success/${data.booking.booking_id}`, {
        state: {
          booking: data.booking,
          transaction_reference: data.transaction_reference,
          tickets: data.tickets,
          selectedSeats: chosen.map((s) => `${s.row_label}-${s.seat_number}`),
          total: data.booking.net_amount,
          event
        }
      });
    } catch (err) {
      setNotice(err.response?.data?.error || 'Booking transaction failed. Please try again.');
      setReview(false);
      fetchEventSeats();
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="seat-page seat-message">
        <Loader2 className="animate-spin text-cyan-400 w-10 h-10 mb-3" />
        <h1 className="text-white text-lg font-bold">Constructing 3D Auditorium View...</h1>
        <p className="text-slate-400 text-xs">Querying database seat layout and row elevations...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="seat-page seat-message">
        <h1 className="text-white text-lg font-bold">{error || 'Event not found'}</h1>
        <Link to="/events" className="text-cyan-400 text-xs font-bold underline mt-2">
          Return to Events Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="seat-page">
      <div className="seat-shell">
        
        {/* Navigation Breadcrumb */}
        <Link className="seat-back" to={`/events/${id}`}>
          <ArrowLeft size={16} /> Back to event details
        </Link>

        {/* Header */}
        <header className="seat-heading">
          <div>
            <span className="seat-eyebrow">INTERACTIVE AUDITORIUM SELECTION</span>
            <h1>{event.title}</h1>
            <p>
              <MapPin size={15} /> {event.venue_name} · {event.venue_city}
            </p>
          </div>
          <span className="seat-step">
            01 Select seats <span> / 02 Server Hold / 03 Confirmation</span>
          </span>
        </header>

        {/* Active Hold Alert Banner */}
        {timeLeft !== null && timeLeft > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/60 border border-amber-600/60 flex items-center justify-between gap-4 text-amber-200 text-xs shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
              <div>
                <strong className="text-white block font-bold">Seats Temporarily Locked for You</strong>
                <span>Database row locks active. Complete payment before the countdown expires.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/50 flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400">Time Left:</span>
              <span className="text-base font-black text-amber-400 font-mono tracking-wider">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>
        )}

        <div className="seat-layout">
          
          {/* Main Auditorium Section */}
          <section className="auditorium" aria-label="Choose your seats">
            
            <div className="seat-toolbar">
              <div>
                <span className="seat-eyebrow">YOUR PERFECT VIEW</span>
                <h2>{isConcert ? 'Live Stage Seating' : 'Auditorium Seating'}</h2>
              </div>
              <div className="seat-view-switch">
                <button aria-pressed={!flat} onClick={() => setFlat(false)}>
                  3D View
                </button>
                <button aria-pressed={flat} onClick={() => setFlat(true)}>
                  2D Map
                </button>
              </div>
            </div>

            {/* 3D View vs 2D Fallback Map */}
            {!flat ? (
              <Suspense fallback={<div className="seat-empty">Loading 3D WebGL auditorium...</div>}>
                <Auditorium3D 
                  seats={seats} 
                  selected={selected} 
                  onToggle={toggleSeat} 
                  event={event} 
                  disabled={processing} 
                  onFallback={() => setFlat(true)} 
                />
              </Suspense>
            ) : (
              <>
                {/* 2D Cinema Screen / Stage */}
                <div className="seat-screen">
                  <span>
                    <Monitor size={22} className="text-cyan-400" />
                    {isConcert ? 'STAGE' : 'SCREEN'}
                  </span>
                  <small>{isConcert ? 'All eyes facing the live stage' : 'All seats face this screen'}</small>
                </div>
                <div className="seat-light-beam" aria-hidden="true" />

                {/* 2D Seats Grid */}
                <div className="seat-map-scroll" tabIndex={0} aria-label="Seating map. Scroll if needed.">
                  <div className={`seat-map ${flat ? 'is-flat' : ''}`} style={{ '--tilt': `${angle}deg`, '--zoom': zoom }}>
                    {rows.map((row) => {
                      const rowSeats = seats
                        .filter((s) => s.row_label === row)
                        .sort((a, b) => a.seat_number - b.seat_number);

                      return (
                        <div className="seat-row" key={row}>
                          <span className="seat-row-label">{row}</span>
                          <div className="seat-row-chairs">
                            {rowSeats.map((seat, index) => {
                              const picked = selected.includes(seat.event_seat_id);
                              const availableState = isAvailable(seat);
                              const state = !availableState
                                ? 'unavailable'
                                : picked
                                ? 'selected'
                                : seat.section === 'VIP'
                                ? 'vip'
                                : 'regular';

                              return (
                                <React.Fragment key={seat.event_seat_id}>
                                  {index === Math.ceil(rowSeats.length / 2) && (
                                    <span className="seat-aisle" aria-hidden="true" />
                                  )}
                                  <button
                                    className={`cinema-chair ${state}`}
                                    disabled={!availableState || processing}
                                    aria-pressed={picked}
                                    aria-label={`Row ${row}, seat ${seat.seat_number}, ${seat.section}, ${money(seat.price)}, ${picked ? 'selected' : seat.status.toLowerCase()}`}
                                    title={`Row ${row} Seat ${seat.seat_number} · ${seat.section} · ${money(seat.price)}`}
                                    onClick={() => toggleSeat(seat)}
                                  >
                                    <span className="chair-back">
                                      {!availableState ? <Lock size={11} /> : picked ? <Check size={14} /> : seat.seat_number}
                                    </span>
                                    <span className="chair-cushion" aria-hidden="true" />
                                  </button>
                                </React.Fragment>
                              );
                            })}
                          </div>
                          <span className="seat-row-label">{row}</span>
                        </div>
                      );
                    })}

                    {!seats.length && (
                      <p className="seat-empty">Seating layout is being generated for this event.</p>
                    )}
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="seat-controls">
                  <span>{isConcert ? 'STAGE ↑' : 'SCREEN ↑'}</span>
                  <div>
                    <button 
                      aria-label="Zoom out" 
                      disabled={zoom <= 0.8} 
                      onClick={() => setZoom((v) => Math.max(0.8, v - 0.1))}
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      aria-label="Zoom in" 
                      disabled={zoom >= 1.3} 
                      onClick={() => setZoom((v) => Math.min(1.3, v + 0.1))}
                    >
                      <Plus size={16} />
                    </button>
                    <button onClick={() => { setZoom(1); setAngle(28); }}>
                      <RotateCcw size={14} /> Reset
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Legend Bar */}
            <div className="seat-legend">
              <span><i className="regular" /> Available</span>
              <span><i className="vip" /> VIP</span>
              <span><i className="selected" /> Selected ✓</span>
              <span><i className="unavailable" /> Unavailable</span>
            </div>
            <p className="seat-map-note">
              Choose up to 6 seats per booking · Prices vary by row
            </p>
          </section>

          {/* Sticky Desktop Booking Summary */}
          <aside className="seat-summary">
            <span className="seat-eyebrow">RESERVATION DETAILS</span>
            <h2><Ticket size={22} /> Booking Summary</h2>

            {/* Event Info Card */}
            <div className="seat-event-card">
              {event.banner_url && <img src={event.banner_url} alt="" />}
              <div>
                <strong>{event.title}</strong>
                <p>{event.venue_name}</p>
                <small>{event.start_time ? new Date(event.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nov 2026'}</small>
              </div>
            </div>

            {/* Selected Seats Chips */}
            <div className="seat-selection-heading">
              <span>Your Chosen Seats</span>
              <span>{chosen.length} / 6 selected</span>
            </div>

            {chosen.length ? (
              <div className="seat-chips">
                {chosen.map((s) => (
                  <button 
                    key={s.event_seat_id} 
                    onClick={() => toggleSeat(s)} 
                    disabled={processing}
                    aria-label={`Remove seat ${s.row_label}${s.seat_number}`}
                  >
                    {s.row_label}{s.seat_number}
                    <small>{money(s.price)} ×</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="seat-empty">
                <Ticket size={28} />
                <p>Click seats on the 3D auditorium or 2D map to reserve.</p>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Seats Subtotal</span>
                <span className="font-bold text-slate-200">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee (5%)</span>
                <span>{money(convenienceFee)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Integrated GST (18%)</span>
                <span>{money(tax)}</span>
              </div>
              <div className="seat-total">
                <span>
                  Net Total <small>{chosen.length} ticket{chosen.length === 1 ? '' : 's'}</small>
                </span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <p className="seat-demo">
              Demo checkout · No real money will be charged.
            </p>

            {notice && <p className="seat-alert" role="alert">{notice}</p>}

            {review && !processing && (
              <p className="seat-review" role="status">
                Seats temporarily held. Review your selection of {chosen.map((s) => `${s.row_label}${s.seat_number}`).join(', ')} for {money(total)}.
              </p>
            )}

            {/* Action Buttons */}
            {!review ? (
              <button
                className="seat-checkout"
                disabled={!chosen.length || processing}
                onClick={initiateHold}
              >
                {processing ? (
                  <><Loader2 size={18} className="animate-spin" /> Locking seats...</>
                ) : (
                  <>Hold Seats & Review <span>→</span></>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  className="seat-checkout"
                  disabled={processing}
                  onClick={completeBooking}
                >
                  {processing ? (
                    <><Loader2 size={18} className="animate-spin" /> Finalizing Booking...</>
                  ) : (
                    <>Confirm & Pay {money(total)}</>
                  )}
                </button>
                <button
                  className="seat-edit"
                  onClick={() => setReview(false)}
                  disabled={processing}
                >
                  Modify Seat Selection
                </button>
              </div>
            )}
          </aside>
        </div>

        {/* Mobile Bottom Sticky Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 z-50 flex items-center justify-between gap-3 shadow-2xl">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {chosen.length} Seat{chosen.length === 1 ? '' : 's'} Selected
            </span>
            <span className="text-lg font-black text-cyan-400">{money(total)}</span>
          </div>

          <div className="flex items-center gap-2">
            {!review ? (
              <button
                disabled={!chosen.length || processing}
                onClick={initiateHold}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md disabled:opacity-50"
              >
                {processing ? 'Locking...' : 'Hold & Review'}
              </button>
            ) : (
              <button
                disabled={processing}
                onClick={completeBooking}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
              >
                {processing ? 'Booking...' : `Pay ${money(total)}`}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
