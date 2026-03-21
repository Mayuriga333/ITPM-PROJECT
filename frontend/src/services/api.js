import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const student = JSON.parse(localStorage.getItem('currentStudent') || 'null');
    const volunteer = JSON.parse(localStorage.getItem('currentVolunteer') || 'null');
    
    if (student) {
      config.headers['X-Student-ID'] = student._id;
    }
    if (volunteer) {
      config.headers['X-Volunteer-ID'] = volunteer._id;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    let message = data?.message || 'Something went wrong';

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const details = data.errors
        .map((e) => e?.message)
        .filter(Boolean)
        .join('\n');

      if (details) {
        message = `${message}${message.endsWith('.') ? '' : ':'} ${details}`;
      }
    }

    toast.error(message);
    return Promise.reject(error);
  }
);

// Volunteer APIs
export const volunteerAPI = {
  register: (data) => API.post('/volunteers/register', data),
  getAll: (params) => API.get('/volunteers', { params }),
  getById: (id) => API.get(`/volunteers/${id}`),
  getRequests: (id) => API.get(`/volunteers/${id}/requests`),
  getStats: (id) => API.get(`/volunteers/${id}/stats`),
};

// Student APIs
export const studentAPI = {
  register: (data) => API.post('/students/register', data),
  getById: (id) => API.get(`/students/${id}`),
  getByEmail: (email) => API.get(`/students/email/${email}`),
  getRequests: (id) => API.get(`/students/${id}/requests`),
  getStats: (id) => API.get(`/students/${id}/stats`),
};

// Request APIs
export const requestAPI = {
  create: (data) => API.post('/requests', data),
  getById: (id) => API.get(`/requests/${id}`),
  update: (id, data) => API.put(`/requests/${id}`, data),
  accept: (id) => API.put(`/requests/${id}/accept`),
  reject: (id, rejectReason) => API.put(`/requests/${id}/reject`, { rejectReason }),
  complete: (id) => API.put(`/requests/${id}/complete`),
  review: (id, payload) => API.post(`/requests/${id}/review`, payload),
  remove: (id) => API.delete(`/requests/${id}`),
};

export default API;