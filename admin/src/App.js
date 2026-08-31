import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import DriversPage from './pages/DriversPage';
import UsersPage from './pages/UsersPage';
import RevenuePage from './pages/RevenuePage';
import AdminUsersPage from './pages/AdminUsersPage';
import { getCurrentUser, hasPermission, isSuperAdmin } from './api';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('rentx_admin_token');
  return token ? children : <Navigate to="/login" />;
};

const PermissionGuard = ({ permission, children }) => {
  if (permission && !isSuperAdmin() && !hasPermission(permission)) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: '#1F2937', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: '#6B7280' }}>You don't have permission to view this page.</p>
      </div>
    );
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="bookings" element={<PermissionGuard permission="manage_bookings"><BookingsPage /></PermissionGuard>} />
          <Route path="drivers" element={<PermissionGuard permission="manage_drivers"><DriversPage /></PermissionGuard>} />
          <Route path="users" element={<PermissionGuard permission="manage_users"><UsersPage /></PermissionGuard>} />
          <Route path="revenue" element={<PermissionGuard permission="view_revenue"><RevenuePage /></PermissionGuard>} />
          <Route path="admins" element={<PermissionGuard permission="manage_admins"><AdminUsersPage /></PermissionGuard>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
