import React, { useEffect, useState } from 'react';
import { listAdmins, createAdmin, updateAdmin, toggleAdminActive } from '../api';

const ALL_PERMISSIONS = [
  { key: 'manage_drivers', label: 'Manage Drivers' },
  { key: 'manage_bookings', label: 'Manage Bookings' },
  { key: 'manage_users', label: 'Manage Riders' },
  { key: 'view_revenue', label: 'View Revenue' },
  { key: 'manage_admins', label: 'Manage Admins' },
];

const emptyForm = { name: '', email: '', password: '', permissions: [] };

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await listAdmins();
      setAdmins(res.data.admins);
    } catch {
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePermission = (key) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (admin) => {
    setForm({ name: admin.name, email: admin.email, password: '', permissions: admin.permissions || [] });
    setEditId(admin._id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const payload = { name: form.name, permissions: form.permissions };
        await updateAdmin(editId, payload);
      } else {
        await createAdmin(form);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (admin) => {
    try {
      await toggleAdminActive(admin._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#1F2937' }}>Admin Users</h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>Manage who has access to this portal</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Admin</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1F2937' }}>{editId ? 'Edit Admin' : 'New Admin'}</h3>
          {error && (
            <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={!!editId} />
              </div>
            </div>
            {!editId && (
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} placeholder="Min. 8 characters" />
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 10 }}>Permissions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {ALL_PERMISSIONS.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 14px', border: `1.5px solid ${form.permissions.includes(p.key) ? '#1B5E20' : '#E5E7EB'}`, borderRadius: 8, background: form.permissions.includes(p.key) ? '#E8F5E9' : '#fff', fontSize: 14, color: form.permissions.includes(p.key) ? '#1B5E20' : '#374151', fontWeight: form.permissions.includes(p.key) ? 600 : 400 }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={form.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} />
                    {form.permissions.includes(p.key) ? '✓ ' : ''}{p.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Admin'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Name', 'Email', 'Role', 'Permissions', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1F2937' }}>{admin.name}</td>
                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 14 }}>{admin.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: admin.role === 'superadmin' ? '#FFF3E0' : '#E8F5E9', color: admin.role === 'superadmin' ? '#E65100' : '#1B5E20' }}>
                      {admin.role === 'superadmin' ? '⭐ Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {admin.role === 'superadmin' ? (
                      <span style={{ color: '#9CA3AF', fontSize: 13 }}>All permissions</span>
                    ) : admin.permissions?.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {admin.permissions.map(p => (
                          <span key={p} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: '#F3F4F6', color: '#374151' }}>
                            {ALL_PERMISSIONS.find(x => x.key === p)?.label || p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#EF4444', fontSize: 13 }}>No permissions</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: admin.isActive ? '#E8F5E9' : '#FFEBEE', color: admin.isActive ? '#1B5E20' : '#C62828' }}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {admin.role !== 'superadmin' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(admin)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Edit</button>
                        <button onClick={() => handleToggle(admin)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: admin.isActive ? '#FFEBEE' : '#E8F5E9', color: admin.isActive ? '#C62828' : '#1B5E20', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          {admin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No admin users found</div>
          )}
        </div>
      )}
    </div>
  );
}
