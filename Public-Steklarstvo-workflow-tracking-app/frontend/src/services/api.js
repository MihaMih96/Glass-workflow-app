// services/api.js
import axios from 'axios';

// Če ni definirana okoljska spremenljivka REACT_APP_API_URL, uporabi "http://localhost:5000"
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL
});

// Interceptor, ki doda JWT token iz localStorage, če obstaja.
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

export default api;
