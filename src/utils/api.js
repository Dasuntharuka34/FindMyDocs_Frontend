import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`, // This will be proxied by setupProxy.js
});

// Request interceptor to add auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Check for maintenance mode (503 Service Unavailable)
    if (error.response?.status === 503 && error.response?.data?.maintenance) {
      // We can't directly access AuthContext here, so we use a custom event
      // or rely on the fact that the app will catch this error.
      // However, a simple way to communicate to the root app is a custom event:
      window.dispatchEvent(new CustomEvent('maintenance-mode', {
        detail: { message: error.response.data.message }
      }));
    }

    return Promise.reject(error);
  }
);

export default api;