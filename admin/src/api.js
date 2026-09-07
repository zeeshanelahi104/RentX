import axios from 'axios';

// Hardcoded rather than relying on CRA's "proxy" field (only works with
// `npm start`'s own dev server) or a build-time env var (silently falls back
// to relative "/api" if the hosting platform's redeploy doesn't pick up
// the env change, which 404s since a static host like Netlify has no /api
// of its own). This way it's always correct regardless of deploy pipeline.
const api = axios.create({
  baseURL: 'https://rentx-bvm4.onrender.com/api',
});

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

// Users / customers
export const getAllUsers = (params) => api.get('/admin/users', { params });

// Revenue
export const getRevenue = (period) => api.get('/admin/revenue', { params: { period } });

// Driver subscriptions
export const getAllSubscriptions = (params) => api.get('/admin/subscriptions', { params });
export const markSubscriptionPaid = (driverId, data) => api.patch(`/admin/subscriptions/${driverId}/mark-paid`, data);
export const extendSubscription = (driverId, data) => api.patch(`/admin/subscriptions/${driverId}/extend`, data);
export const getSubscriptionConfig = () => api.get('/admin/subscriptions/config');
export const updateSubscriptionConfig = (data) => api.patch('/admin/subscriptions/config', data);
export const getSubscriptionStats = () => api.get('/admin/subscriptions/stats');
export const grantFreeMonthBulk = () => api.post('/admin/subscriptions/grant-free-month-bulk');

// Admin user management (superadmin only)
export const listAdmins = () => api.get('/admin/admins');
export const createAdmin = (data) => api.post('/admin/admins', data);
export const updateAdmin = (id, data) => api.patch(`/admin/admins/${id}`, data);
export const toggleAdminActive = (id) => api.patch(`/admin/admins/${id}/toggle-active`);

// Admin auth
export const adminLogin = (email, password) => api.post('/admin/auth/login', { email, password });
export const adminRegister = (name, email, password) => api.post('/admin/auth/register', { name, email, password });

export default api;
