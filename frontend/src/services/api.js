/**
 * services/api.js — Unified Axios instance with ALL endpoints from P1, P2, P3
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

    // P3 compatibility: attach X-Student-ID / X-Volunteer-ID headers
    const student = JSON.parse(localStorage.getItem('currentStudent') || 'null');
    const volunteer = JSON.parse(localStorage.getItem('currentVolunteer') || 'null');
    if (student)   config.headers['X-Student-ID']   = student._id;
    if (volunteer) config.headers['X-Volunteer-ID'] = volunteer._id;

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
      localStorage.removeItem('currentStudent');
      localStorage.removeItem('currentVolunteer');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════════════════════════════════════
//  P1 — Auth, Chat, Match, Admin, Messages
// ══════════════════════════════════════════════════════════════════════════════

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  getMe:         ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteProfile: ()     => api.delete('/auth/profile'),
};

export const chatAPI = {
  sendMessage:  (message) => api.post('/chat/message', { message }),
  getHistory:   ()        => api.get('/chat/history'),
  resetSession: ()        => api.delete('/chat/reset'),
};

export const matchAPI = {
  getMatches:    ()     => api.get('/match/volunteers'),
  getMyProfile:  ()     => api.get('/match/profile'),
  upsertProfile: (data) => api.post('/match/profile', data),
};

export const adminAPI = {
  getStats:          ()                    => api.get('/admin/stats'),
  getUsers:          (params)              => api.get('/admin/users', { params }),
  updateUserStatus:  (id, data)            => api.patch(`/admin/users/${id}/status`, data),
  deleteUser:        (id)                  => api.delete(`/admin/users/${id}`),
  getProfiles:       (params)              => api.get('/admin/profiles', { params }),
  moderateProfile:   (id, data)            => api.patch(`/admin/profiles/${id}/moderate`, data),
  flagProfile:       (id, data)            => api.patch(`/admin/profiles/${id}/flag`, data),
};

export const messageAPI = {
  startConversation: (data)    => api.post('/messages/conversations', data),
  sendMessage:       (data)    => api.post('/messages/send', data),
  getConversations:  ()        => api.get('/messages/conversations'),
  getMessages:       (id)      => api.get(`/messages/conversations/${id}/messages`),
  archiveConversation: (id)    => api.put(`/messages/conversations/${id}/archive`),
  getUnreadCount:    ()        => api.get('/messages/unread-count'),
};

// ══════════════════════════════════════════════════════════════════════════════
//  P2 — Ratings, Reviews, Smart Matching (volunteers, reviews, sessions)
// ══════════════════════════════════════════════════════════════════════════════

export const ratingVolunteerAPI = {
  getAll:           (params) => api.get('/volunteers', { params }),
  getById:          (id)     => api.get(`/volunteers/${id}`),
  getProfile:       ()       => api.get('/volunteers/profile'),
  create:           (data)   => api.post('/volunteers', data),
  update:           (id, data) => api.put(`/volunteers/${id}`, data),
  getLeaderboard:   ()       => api.get('/volunteers/leaderboard'),
};

export const reviewAPI = {
  create:           (data)   => api.post('/reviews', data),
  getByVolunteer:   (id)     => api.get(`/reviews/volunteer/${id}`),
  getPending:       ()       => api.get('/reviews/pending'),
  moderate:         (id, data) => api.patch(`/reviews/${id}/moderate`, data),
};

export const sessionAPI = {
  getAll:           (params) => api.get('/sessions', { params }),
  getById:          (id)     => api.get(`/sessions/${id}`),
  create:           (data)   => api.post('/sessions', data),
  updateStatus:     (id, data) => api.patch(`/sessions/${id}/status`, data),
  complete:         (id, data) => api.patch(`/sessions/${id}/complete`, data),
};

export const smartMatchAPI = {
  findMatch:        (data)   => api.post('/matching', data),
};

// ══════════════════════════════════════════════════════════════════════════════
//  P3 — Study Support Requests & Disputes
// ══════════════════════════════════════════════════════════════════════════════

export const studyStudentAPI = {
  register:     (data)        => api.post('/study-students/register', data),
  getById:      (id)          => api.get(`/study-students/${id}`),
  getByEmail:   (email)       => api.get(`/study-students/email/${email}`),
  getRequests:  (id, name)    => api.get(`/study-students/${id}/requests`, { params: name ? { studentName: name } : {} }),
  getStats:     (id, name)    => api.get(`/study-students/${id}/stats`, { params: name ? { studentName: name } : {} }),
};

export const studyVolunteerAPI = {
  register:     (data)   => api.post('/study-volunteers/register', data),
  getAll:       (params) => api.get('/study-volunteers', { params }),
  getById:      (id)     => api.get(`/study-volunteers/${id}`),
  getRequests:  (id)     => api.get(`/study-volunteers/${id}/requests`),
  getStats:     (id)     => api.get(`/study-volunteers/${id}/stats`),
};

export const studyRequestAPI = {
  create:   (data)               => api.post('/requests', data),
  getById:  (id)                 => api.get(`/requests/${id}`),
  update:   (id, data)           => api.put(`/requests/${id}`, data),
  accept:   (id)                 => api.put(`/requests/${id}/accept`),
  reject:   (id, rejectReason)   => api.put(`/requests/${id}/reject`, { rejectReason }),
  complete: (id)                 => api.put(`/requests/${id}/complete`),
  review:   (id, payload)        => api.post(`/requests/${id}/review`, payload, payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  remove:   (id)                 => api.delete(`/requests/${id}`),
};

// P3 backward-compatibility aliases (so study/ pages can import original names)
export { studyStudentAPI as studentAPI, studyVolunteerAPI as volunteerAPI, studyRequestAPI as requestAPI };

export default api;
