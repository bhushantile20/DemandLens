import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach demo-auth header to every request
api.interceptors.request.use((config) => {
  config.headers['X-Demo-Token'] = 'demo-secret-2024';
  return config;
});

// ─── Existing endpoints ───────────────────────────────────────────
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getItems             = () => api.get('/items/');
export const getItemForecast      = (id) => api.get(`/items/${id}/forecast/`);
export const getAlerts            = () => api.get('/alerts/reorder/');
export const runForecast          = () => api.post('/forecast/run/');

// ─── User profile endpoints ───────────────────────────────────────
export const updateName = (name) =>
  api.put('/user/update-name/', { name });

export const updateEmail = (email) =>
  api.put('/user/update-email/', { email });

export const updatePassword = (current_password, new_password) =>
  api.put('/user/update-password/', { current_password, new_password });

export default api;
