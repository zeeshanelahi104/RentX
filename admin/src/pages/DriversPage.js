import React, { useEffect, useState } from 'react';
import api from '../api';

const MOCK_DRIVERS = [
  { _id: '1', userId: { name: 'Ahmed Ali', phone: '+923001234567', rating: 4.8 }, city: 'Chiniot', cnicNumber: '33100-1234567-1', verificationStatus: 'pending', totalTrips: 0, createdAt: new Date().toISOString() },
  { _id: '2', userId: { name: 'Muhammad Usman', phone: '+923011234567', rating: 4.6 }, city: 'Faisalabad', cnicNumber: '33201-1234567-2', verificationStatus: 'approved', totalTrips: 24, createdAt: new Date().toISOString() },
  { _id: '3', userId: { name: 'Tariq Mehmood', phone: '+923021234567', rating: 4.9 }, city: 'Jhang', cnicNumber: '33501-1234567-3', verificationStatus: 'approved', totalTrips: 67, createdAt: new Date().toISOString() },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchDrivers = () => {
    setLoading(true);
    api.get('/admin/drivers', { params: { status: filter !== 'all' ? filter : undefined } })
      .then(r => setDrivers(r.data.drivers))
      .catch(() => setDrivers(MOCK_DRIVERS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(); }, [filter]);

  const handleVerify = async (id) => {
    try {
      await api.patch(`/admin/drivers/${id}/verify`);
      fetchDrivers();
    } catch { alert('Error verifying driver'); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await api.patch(`/admin/drivers/${id}/reject`, { reason });
      fetchDrivers();
    } catch { alert('Error rejecting driver'); }
  };

  const filtered = drivers.filter(d =>
    d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.userId?.phone?.includes(search) ||
    d.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Drivers Management</h2>

      <div className="filters">
        <input placeholder="Search by name, phone, city..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 280 }} />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Drivers</option>
          <option value="pending">Pending Verification</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Drivers ({filtered.length})</h2>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>City</th>
                <th>CNIC</th>
                <th>Trips</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(driver => (
                <tr key={driver._id}>
                  <td><strong>{driver.userId?.name || '—'}</strong></td>
                  <td>{driver.userId?.phone}</td>
                  <td>📍 {driver.city}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{driver.cnicNumber}</td>
                  <td>{driver.totalTrips || 0}</td>
                  <td>⭐ {driver.userId?.rating?.toFixed(1)}</td>
                  <td><span className={`badge ${driver.verificationStatus}`}>{driver.verificationStatus?.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: 12, color: '#6B7280' }}>{new Date(driver.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {driver.verificationStatus !== 'approved' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleVerify(driver._id)}>✓ Verify</button>
                      )}
                      {driver.verificationStatus !== 'rejected' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(driver._id)}>✗ Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
