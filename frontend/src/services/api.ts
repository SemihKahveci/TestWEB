import axios from 'axios';

// Dinamik API base URL - hem local hem live'da çalışır
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000/api'  // Development
  : '/api';  // Production (aynı domain'de serve edilir)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  verify: () =>
    api.get('/auth/verify'),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () =>
    api.get('/admin/dashboard-stats'),
  
  getAllAdmins: () =>
    api.get('/admin'),
  
  createAdmin: (adminData: any) =>
    api.post('/admin', adminData),
  
  updateAdmin: (id: string, adminData: any) =>
    api.put(`/admin/${id}`, adminData),
  
  deleteAdmin: (id: string) =>
    api.delete(`/admin/${id}`),
};

// Authorization API
export const authorizationAPI = {
  getAll: () =>
    api.get('/authorization'),
  
  create: (authorizationData: any) =>
    api.post('/authorization', authorizationData),
  
  update: (id: string, authorizationData: any) =>
    api.put(`/authorization/${id}`, authorizationData),
  
  delete: (id: string) =>
    api.delete(`/authorization/${id}`),
};

// Organization API
export const organizationAPI = {
  getAll: () =>
    api.get('/organization'),
  
  getById: (id: string) =>
    api.get(`/organization/${id}`),
  
  create: (organizationData: any) =>
    api.post('/organization', organizationData),
  
  update: (id: string, organizationData: any) =>
    api.put(`/organization/${id}`, organizationData),
  
  delete: (id: string) =>
    api.delete(`/organization/${id}`),
};

// Group Management API
export const groupAPI = {
  getAll: () => api.get('/group'),
  getById: (id: string) => api.get(`/group/${id}`),
  create: (data: any) => api.post('/group', data),
  update: (id: string, data: any) => api.put(`/group/${id}`, data),
  delete: (id: string) => api.delete(`/group/${id}`),
};

// Competency API
export const competencyAPI = {
  getAll: () =>
    api.get('/competency'),
  
  create: (competencyData: any) =>
    api.post('/competency', competencyData),
  
  update: (id: string, competencyData: any) =>
    api.put(`/competency/${id}`, competencyData),
  
  delete: (id: string) =>
    api.delete(`/competency/${id}`),
};

// Game Management API
export const gameManagementAPI = {
  getAll: () =>
    api.get('/game-management'),
  
  create: (gameData: any) =>
    api.post('/game-management', gameData),
  
  update: (id: string, gameData: any) =>
    api.put(`/game-management/${id}`, gameData),
  
  delete: (id: string) =>
    api.delete(`/game-management/${id}`),
};


// Evaluation API
export const evaluationAPI = {
  getAll: () => {
    return api.get('/user-results');
  },
  
  getById: (id: string) =>
    api.get(`/evaluation/${id}`),
  
  generatePDF: (data: any) =>
    api.post('/evaluation/generate-pdf', data),
  
  previewPDF: (code: string, options: any) =>
    api.get(`/evaluation/preview-pdf?code=${code}&${new URLSearchParams(options)}`),
};

// Company Management API
export const companyAPI = {
  getAll: () =>
    api.get('/company-management'),
  
  create: (data: { vkn: string; firmName: string; firmMail: string }) =>
    api.post('/company-management', data),
  
  update: (vkn: string, data: { firmName: string; firmMail: string }) =>
    api.put(`/company-management/${vkn}`, data),
  
  delete: (vkn: string) =>
    api.delete(`/company-management/${vkn}`)
};


export default api;
