import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, MapPin, DollarSign, ArrowRight, 
  Tag, Heart, Star, SlidersHorizontal, CheckCircle2 
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function EventListing({ events, onSelectEvent, categories }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('recommended');
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

  let filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? e.category_name === selectedCategory : true;
    const matchesLocation = selectedLocation ? e.venue_city.toLowerCase().includes(selectedLocation.toLowerCase()) : true;
    const matchesPrice = parseFloat(e.min_price || 0) <= maxPrice;
    return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
  });

  if (sortBy === 'price-low') {
    filteredEvents.sort((a, b) => parseFloat(a.min_price) - parseFloat(b.min_price));
  } else if (sortBy === 'date') {
    filteredEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* Search & Filter Top Bar */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Discover Events</h1>
            <p className="text-slate-400 text-xs font-mono">Filter by location, category, date, and price range</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by title, artist, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          
          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Locations Across India</option>
              <option value="Chennai">Chennai, Tamil Nadu</option>
              <option value="Bengaluru">Bengaluru, Karnataka</option>
              <option value="Mumbai">Mumbai, Maharashtra</option>
              <option value="Delhi">New Delhi, NCR</option>
              <option value="Hyderabad">Hyderabad, Telangana</option>
              <option value="Kolkata">Kolkata, West Bengal</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="recommended">Recommended Match</option>
              <option value="price-low">Price: Low to High</option>
              <option value="date">Date: Earliest First</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Max Price: <span className="text-indigo-400 font-bold">₹{maxPrice}</span>
            </label>
            <input
              type="range"
              min="299"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer mt-1"
            />
          </div>

        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
          <p className="text-slate-400 text-sm">No events found matching your filter criteria. Try adjusting your filters!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, idx) => {
            const isWishlisted = wishlist.includes(event.event_id);
            const matchScore = idx === 0 ? 94 : idx === 1 ? 90 : 85;

            return (
              <div
                key={event.event_id}
                onClick={() => onSelectEvent(event)}
                className="group bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-indigo-500/50 overflow-hidden cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.banner_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Match Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-xs font-bold text-cyan-300">
                      ★ {matchScore}% Match
                    </div>

                    {/* Wishlist Button */}
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
                    <div className="text-[10px] font-mono font-bold uppercase text-indigo-400">{event.category_name}</div>
                    
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    
                    <p className="text-slate-400 text-xs line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-1 pt-2 border-t border-slate-800 text-xs text-slate-400 font-mono">
                      <div className="flex justify-between items-center">
                        <span>📍 {event.venue_name}, {event.venue_city}</span>
                        <span className="text-emerald-400 font-semibold">{event.total_tickets_available} Available</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        📅 {new Date(event.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="w-full py-2.5 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors">
                    <span>Book Tickets</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
