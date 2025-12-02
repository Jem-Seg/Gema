import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  register: async (username, password) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Stock services
export const stockService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/stocks${params ? `?${params}` : ''}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/stocks/${id}`);
    return response.data;
  },
  create: async (stock) => {
    const response = await api.post('/stocks', stock);
    return response.data;
  },
  update: async (id, stock) => {
    const response = await api.put(`/stocks/${id}`, stock);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/stocks/${id}`);
    return response.data;
  },
  addMovement: async (id, movement) => {
    const response = await api.post(`/stocks/${id}/movement`, movement);
    return response.data;
  },
  getMovements: async (id) => {
    const response = await api.get(`/stocks/${id}/movements`);
    return response.data;
  }
};

// Category services
export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  create: async (category) => {
    const response = await api.post('/categories', category);
    return response.data;
  },
  update: async (id, category) => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};

export default api;
