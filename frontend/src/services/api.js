import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Adjust if backend port changes
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getItems = () => api.get('/items/');
export const getItemForecast = (id) => api.get(`/items/${id}/forecast/`);
export const getAlerts = () => api.get('/alerts/reorder/');
export const runForecast = () => api.post('/forecast/run/');

export default api;
