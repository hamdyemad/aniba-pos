import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add interceptors if needed (e.g., for auth tokens)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  const lang = localStorage.getItem('pos_language') || 'ar';
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add custom headers
  const countryCode = localStorage.getItem('pos-country-code') || 'eg';
  config.headers['X-Country-Code'] = countryCode;
  config.headers['vendor-key'] = import.meta.env.VITE_VENDOR_KEY;
  config.headers['lang'] = lang;

  // Add default params for GET requests (except for singular resources like 'current')
  if (config.method === 'get' && !config.url?.includes('current')) {
    config.params = {
      per_page: 10,
      ...config.params,
    };
  }

  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Network Errors (no response from server)
    if (!error.response) {
      toast.error('Network Error: Please check your internet connection or server status.', {
        id: 'network-error',
      });
    } 
    // Handle specific HTTP error codes
    else if (error.response.status === 401) {
      localStorage.removeItem('pos_token');
      toast.error('Session expired. Please login again.', { id: 'auth-error' });
    } else if (error.response.status >= 500) {
      toast.error('Server error. Please try again later.', { id: 'server-error' });
    } else if (error.response.data?.message) {
      // Backend returned a specific validation or business error message
      toast.error(error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;
