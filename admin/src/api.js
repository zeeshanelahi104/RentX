import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('rentx_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('rentx_admin_token');
    localStorage.removeItem('rentx_admin_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

// Auth helpers
export const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem('rentx_admin_user') || 'null'); }
  catch { return null; }
};

export const hasPermission = (permission) => {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  return user.permissions?.includes(permission) ?? false;
};

export const isSuperAdmin = () => getCurrentUser()?.role === 'superadmin';

// Dashboard stats
export const getStats = () => api.get('/admin/stats');

// Bookings
export const getAllBookings = (params) => api.get('/admin/bookings', { params });

// Drivers
export const getAllDrivers = (params) => api.get('/admin/drivers', { params });
export const verifyDriver = (id) => api.patch(`/admin/drivers/${id}/verify`);
export const rejectDriver = (id, reason) => api.patch(`/admin/drivers/${id}/reject`, { reason });

// Users / riders
export const getAllUsers = (params) => api.get('/admin/users', { params });

// Revenue
export const getRevenue = (period) => api.get('/admin/revenue', { params: { period } });

// Admin user management (superadmin only)
export const listAdmins = () => api.get('/admin/admins');
export const createAdmin = (data) => api.post('/admin/admins', data);
export const updateAdmin = (id, data) => api.patch(`/admin/admins/${id}`, data);
export const toggleAdminActive = (id) => api.patch(`/admin/admins/${id}/toggle-active`);

// Admin auth
export const adminLogin = (email, password) => api.post('/admin/auth/login', { email, password });
export const adminRegister = (name, email, password) => api.post('/admin/auth/register', { name, email, password });

export default api;
