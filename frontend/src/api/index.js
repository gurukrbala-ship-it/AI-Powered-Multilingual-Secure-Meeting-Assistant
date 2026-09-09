import api from './axios';

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  updateMe: (data) => api.put('/api/auth/me', data),
};

// ─── Meetings ─────────────────────────────────────────────────────────────
export const meetingsAPI = {
  list: (params) => api.get('/api/meetings', { params }),
  get: (id) => api.get(`/api/meetings/${id}`),
  create: (data) => api.post('/api/meetings', data),
  update: (id, data) => api.put(`/api/meetings/${id}`, data),
  delete: (id) => api.delete(`/api/meetings/${id}`),
  start: (id) => api.post(`/api/meetings/${id}/start`),
  end: (id) => api.post(`/api/meetings/${id}/end`),
};

// ─── Participants ─────────────────────────────────────────────────────────
export const participantsAPI = {
  list: (meetingId) => api.get(`/api/meetings/${meetingId}/participants`),
  add: (meetingId, data) => api.post(`/api/meetings/${meetingId}/participants`, data),
  remove: (meetingId, userId) => api.delete(`/api/meetings/${meetingId}/participants/${userId}`),
};

// ─── Transcript ───────────────────────────────────────────────────────────
export const transcriptAPI = {
  get: (meetingId) => api.get(`/api/meetings/${meetingId}/transcript`),
  add: (meetingId, data) => api.post(`/api/meetings/${meetingId}/transcript`, data),
};

// ─── AI / Summary ─────────────────────────────────────────────────────────
export const aiAPI = {
  getSummary: (meetingId) => api.get(`/api/meetings/${meetingId}/summary`),
  generateSummary: (meetingId) => api.post(`/api/meetings/${meetingId}/generate-summary`),
  getDecisions: (meetingId) => api.get(`/api/meetings/${meetingId}/decisions`),
  getActions: (meetingId) => api.get(`/api/meetings/${meetingId}/actions`),
  updateAction: (itemId, data) => api.put(`/api/meetings/action-items/${itemId}`, data),
  ask: (meetingId, question) => api.post(`/api/meetings/${meetingId}/ask`, { question }),
  getAuditLogs: (meetingId) => api.get(`/api/meetings/${meetingId}/audit-logs`),
};

// ─── Search & Insights ────────────────────────────────────────────────────
export const insightsAPI = {
  dashboard: () => api.get('/api/insights/dashboard'),
  search: (q) => api.get('/api/search', { params: { q } }),
  myActions: () => api.get('/api/action-items/my'),
};

// ─── Config ───────────────────────────────────────────────────────────────
export const configAPI = {
  getPublic: () => api.get('/api/config/public'),
};
