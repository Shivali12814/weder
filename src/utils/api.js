import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Backend URL ──────────────────────────────────────────────────────────────
// Replace this with your ngrok or Render URL when testing on a real device.
// Example ngrok:  https://xxxx-xxx.ngrok-free.app/api
// Example Render: https://weder-backend.onrender.com/api
const BASE_URL = 'https://say-scarily-vindicate.ngrok-free.dev/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

API.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('weder_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try { await SecureStore.deleteItemAsync('weder_token'); } catch {}
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser      = (d) => API.post('/auth/login', d);
export const registerUser   = (d) => API.post('/auth/register', d);
export const getMe          = ()  => API.get('/auth/me');
export const updateProfile  = (d) => API.put('/auth/profile', d);
export const changePassword = (d) => API.put('/auth/change-password', d);
export const deleteAccount  = ()  => API.delete('/auth/account');

// ─── Weddings ─────────────────────────────────────────────────────────────────
export const getWeddings    = ()  => API.get('/weddings');
export const createWedding  = (d) => API.post('/weddings', d);
export const updateWedding  = (id, d) => API.put(`/weddings/${id}`, d);
export const getDashboard   = (id) => API.get(`/weddings/${id}/dashboard`);

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const getVendors     = (p) => API.get('/vendors', { params: p });
export const getVendor      = (id) => API.get(`/vendors/${id}`);
export const updateVendorProfile = (d) => API.put('/vendors/profile', d);

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const getBookings    = (p) => API.get('/bookings', { params: p });
export const createBooking  = (d) => API.post('/bookings', d);
export const updateBooking  = (id, d) => API.put(`/bookings/${id}`, d);
export const deleteBooking  = (id) => API.delete(`/bookings/${id}`);

// ─── Guests ───────────────────────────────────────────────────────────────────
export const getGuests      = (p) => API.get('/guests', { params: p });
export const createGuest    = (d) => API.post('/guests', d);
export const updateGuest    = (id, d) => API.put(`/guests/${id}`, d);
export const deleteGuest    = (id) => API.delete(`/guests/${id}`);

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const getTasks       = (p) => API.get('/tasks', { params: p });
export const createTask     = (d) => API.post('/tasks', d);
export const updateTask     = (id, d) => API.put(`/tasks/${id}`, d);
export const toggleTask     = (id) => API.patch(`/tasks/${id}/toggle`);
export const deleteTask     = (id) => API.delete(`/tasks/${id}`);

// ─── Budget ───────────────────────────────────────────────────────────────────
export const getBudget      = (p) => API.get('/budget', { params: p });

// ─── Dahej / Trousseau ────────────────────────────────────────────────────────
export const getDahejItems   = (p) => API.get('/dahej', { params: p });
export const getDahejSummary = (p) => API.get('/dahej/summary', { params: p });
export const seedDahejItems  = (d) => API.post('/dahej/seed', d);
export const createDahejItem = (d) => API.post('/dahej', d);
export const updateDahejItem = (id, d) => API.put(`/dahej/${id}`, d);
export const deleteDahejItem = (id) => API.delete(`/dahej/${id}`);

// ─── Vendor requests (client side) ───────────────────────────────────────────
export const sendBookingRequest = (d) => API.post('/requests', d);
export const getClientRequests  = (p) => API.get('/requests', { params: p });

export default API;
