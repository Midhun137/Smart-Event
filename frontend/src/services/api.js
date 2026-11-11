import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Events
export const getEvents = (params) => api.get('/events/', { params });
export const getEventById = (id) => api.get(`/events/${id}`);
export const getEventCategories = () => api.get('/events/categories');
export const getVenues = () => api.get('/events/venues');
export const createEvent = (data) => api.post('/events/', data);

// Bookings & Seats
export const getSeats = (eventId) => api.get(`/bookings/seats/${eventId}`);
export const holdSeats = (data) => api.post('/bookings/hold', data);
export const releaseHold = (data) => api.post('/bookings/release-hold', data);
export const createBooking = (data) => api.post('/bookings/book', data);
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const getUserBookings = (userId) => api.get(`/bookings/user/${userId}`);
export const getAllBookings = () => api.get('/bookings/all');
export const cancelBooking = (id) => api.post(`/bookings/cancel/${id}`);
export const validateTicket = (data) => api.post('/bookings/tickets/validate', data);
export const simulateRaceCondition = (data) => api.post('/bookings/simulate-race-condition', data);

// Auth & User Profile
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getProfile = (userId) => api.get(`/auth/profile/${userId}`);
export const updatePreferences = (userId, data) => api.put(`/auth/preferences/${userId}`, data);
export const getCurrentUser = () => api.get('/auth/me');

// Recommendations & Arcade
export const getUserRecommendations = (userId) => api.get(`/recommendations/user/${userId}`);
export const getRecommendedGroupSeats = (data) => api.post('/recommendations/group-seats', data);
export const getRewards = (userId) => api.get(`/rewards/user/${userId}`);
export const getLeaderboard = () => api.get('/gamification/leaderboard');
export const getQuizzes = (eventId = 0) => api.get(`/gamification/quizzes/${eventId}`);
export const getArcadeStatus = (userId) => api.get('/arcade/status', { params: { user_id: userId } });
export const spinArcadeWheel = () => api.post('/arcade/spin');

// Analytics (Admin)
export const getOrganizerAnalytics = (organizerId) => api.get(`/analytics/organizer/${organizerId}`);

export default api;
