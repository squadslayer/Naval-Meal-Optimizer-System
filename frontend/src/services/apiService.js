import axios from 'axios';
import toast from 'react-hot-toast';

// The Vite proxy in vite.config.js handles redirecting /api to http://localhost:8000
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  // This header is crucial for Django to correctly parse the request body
  headers: {
    'Content-Type': 'application/json',
  },
});

// This interceptor adds the auth token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Define API methods
export const authAPI = {
  login: (credentials) => api.post('/login/', credentials),
};

export const adminAPI = {
  getStock: () => api.get('/admin/stock/'),
  // Add other admin functions here
};

export const sailorAPI = {
  getProfile: () => api.get('/api/sailor/profile/'),
  updateProfile: (profileData) => api.put('/api/sailor/profile/', profileData),
  submitFeedback: (feedbackData) => api.post('/api/sailor/feedback/', feedbackData),
  getMealPlans: () => api.get('/api/sailor/meal-plans/'),
};

// --- NEW API METHODS FOR CHEF ---
export const chefAPI = {
  getAssignments: () => api.get('/chef/assignments/'),
};

export default api;