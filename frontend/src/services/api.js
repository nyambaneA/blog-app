import axios from 'axios';

// Smart API URL detection
const getApiUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Auto-detect based on current location
  const isProduction = window.location.hostname.includes('vercel.app');
  
  if (isProduction) {
    // In production on Vercel
    return window.location.origin + '/api';
  } else {
    // In local development
    return 'http://localhost:5000/api';
  }
};

const API_URL = getApiUrl();

console.log('🔧 API URL configured as:', API_URL); // Debug log

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code
    });
    
    // Handle network errors (mobile-specific)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('🌐 Network error - check:');
      console.error('  1. Is backend running?');
      console.error('  2. Correct API URL?', API_URL);
      console.error('  3. CORS configured?');
      
      // Don't redirect on network errors - just show error
      return Promise.reject(new Error('Cannot connect to server. Please check your internet connection.'));
    }
    
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;