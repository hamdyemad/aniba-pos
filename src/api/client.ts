import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = 'ar';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error (connection refused, timeout, etc.)
      toast.error('Network Connection Error. Please check your server or internet connection.', {
        id: 'network-error', // Use unique id to prevent multiple identical toasts
      });
    } else if (error.response.status === 401) {
      localStorage.removeItem('pos_token');
      toast.error('Session expired. Please login again.', { id: 'auth-error' });
    } else if (error.response.status >= 500) {
      toast.error('Server error. Please try again later.', { id: 'server-error' });
    } else if (error.response.data?.message) {
      // API returned a specific error message
      toast.error(error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);

export { api };
