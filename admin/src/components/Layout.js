import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, hasPermission, isSuperAdmin } from '../api';

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', permission: null },
  { to: '/bookings', icon: '📅', label: 'Bookings', permission: 'manage_bookings' },
  { to: '/drivers', icon: '🚗', label: 'Drivers', permission: 'manage_drivers' },
  { to: '/users', icon: '👥', label: 'Riders', permission: 'manage_users' },
  { to: '/revenue', icon: '💰', label: 'Revenue', permission: 'view_revenue' },
  { to: '/admins', icon: '🔐', label: 'Admin Users', permission: 'manage_admins' },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('rentx_admin_token');
    localStorage.removeItem('rentx_admin_user');
    navigate('/login');
  };

  const canSee = (permission) => {
    if (!permission) return true;
    if (isSuperAdmin()) return true;
    return hasPermission(permission);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          RentX
          <span>Admin Portal</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.filter(n => canSee(n.permission)).map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => isActive ? 'active' : ''}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {user && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{user.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
                {user.role === 'superadmin' ? '⭐ Super Admin' : '👤 Admin'}
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', width: '100%', fontWeight: 600 }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>RentX Admin</h1>
          <span style={{ color: '#6B7280', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
