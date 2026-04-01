/**
 * services/api.js — Centralized Axios instance with JWT injection
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: handle 401 globally ────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  getMe:         ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteProfile: ()     => api.delete('/auth/profile'),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage:  (message) => api.post('/chat/message', { message }),
  getHistory:   ()        => api.get('/chat/history'),
  resetSession: ()        => api.delete('/chat/reset'),
};

// ── Match ─────────────────────────────────────────────────────────────────────
export const matchAPI = {
  getMatches:    ()     => api.get('/match/volunteers'),
  getMyProfile:  ()     => api.get('/match/profile'),
  upsertProfile: (data) => api.post('/match/profile', data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:          ()                    => api.get('/admin/stats'),
  getUsers:          (params)              => api.get('/admin/users', { params }),
  updateUserStatus:  (id, data)            => api.patch(`/admin/users/${id}/status`, data),
  deleteUser:        (id)                  => api.delete(`/admin/users/${id}`),
  getProfiles:       (params)              => api.get('/admin/profiles', { params }),
  moderateProfile:   (id, data)            => api.patch(`/admin/profiles/${id}/moderate`, data),
  flagProfile:       (id, data)            => api.patch(`/admin/profiles/${id}/flag`, data),
};

// ── Messages ───────────────────────────────────────────────────────────────────
export const messageAPI = {
  startConversation: (data)    => api.post('/messages/conversations', data),
  sendMessage:       (data)    => api.post('/messages/send', data),
  getConversations:  ()        => api.get('/messages/conversations'),
  getMessages:       (id)      => api.get(`/messages/conversations/${id}/messages`),
  archiveConversation: (id)    => api.put(`/messages/conversations/${id}/archive`),
  getUnreadCount:    ()        => api.get('/messages/unread-count'),
};

export default api;