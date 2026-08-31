import React, { useEffect, useState } from 'react';
import api from '../api';

const MOCK = [
  { _id: 'u1', name: 'Bilal Shah', phone: '+923001234567', role: 'rider', city: 'Chiniot', rating: 5.0, createdAt: new Date().toISOString() },
  { _id: 'u2', name: 'Sara Khan', phone: '+923011234567', role: 'rider', city: 'Faisalabad', rating: 4.7, createdAt: new Date().toISOString() },
  { _id: 'u3', name: 'Ahmed Ali', phone: '+923021234567', role: 'driver', city: 'Chiniot', rating: 4.8, createdAt: new Date().toISOString() },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users', { params: { role: role || undefined } })
      .then(r => setUsers(r.data.users))
      .catch(() => setUsers(MOCK))
      .finally(() => setLoading(false));
  }, [role]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Users & Riders</h2>

      <div className="filters">
        <input placeholder="Search name, phone, city..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 260 }} />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All Users</option>
          <option value="rider">Riders Only</option>
          <option value="driver">Drivers Only</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Users ({filtered.length})</h2>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Role</th><th>City</th><th>Rating</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.name || '—'}</strong></td>
                  <td>{u.phone}</td>
                  <td>
                    <span style={{ background: u.role === 'driver' ? '#E8F5E9' : '#E3F2FD', color: u.role === 'driver' ? '#2E7D32' : '#1565C0', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {u.role === 'driver' ? '🚗 Driver' : '👤 Rider'}
                    </span>
                  </td>
                  <td>📍 {u.city}</td>
                  <td>⭐ {u.rating?.toFixed(1)}</td>
                  <td style={{ fontSize: 12, color: '#6B7280' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
