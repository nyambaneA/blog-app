import axios from 'axios';

// ==============================
// API URL Configuration
// ==============================
// Priority:
// 1. REACT_APP_API_URL (if explicitly set)
// 2. Production → relative /api
// 3. Development → localhost
// ==============================

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:5000/api');

// Debug (safe to keep during testing)
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 API URL configured as:', API_URL);

// ==============================
// Axios Instance
// ==============================
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================
// Request Interceptor
// ==============================
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

// ==============================
// Response Interceptor
// ==============================
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
      code: error.code,
    });

    // Network / server unreachable
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return Promise.reject(
        new Error('Cannot connect to server. Please try again later.')
      );
    }

    // Auth expired
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
