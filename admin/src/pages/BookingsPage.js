import React, { useEffect, useState } from 'react';
import api from '../api';

const STATUS_COLORS = { pending: 'pending', accepted: 'accepted', active: 'active', completed: 'completed', cancelled: 'cancelled' };

const MOCK = [
  { _id: 'b1', riderId: { name: 'Bilal Shah' }, driverId: { userId: { name: 'Ahmed Ali' } }, vehicleId: { make: 'Toyota', model: 'Corolla' }, tripType: 'wedding', pickupLocation: { address: 'Chiniot' }, totalAmount: 15000, commission: 2250, status: 'completed', startDate: new Date().toISOString(), createdAt: new Date().toISOString() },
  { _id: 'b2', riderId: { name: 'Sara Khan' }, driverId: { userId: { name: 'Usman' } }, vehicleId: { make: 'Honda', model: 'Civic' }, tripType: 'intercity', pickupLocation: { address: 'Faisalabad' }, totalAmount: 7000, commission: 1050, status: 'active', startDate: new Date().toISOString(), createdAt: new Date().toISOString() },
  { _id: 'b3', riderId: { name: 'Hamza Butt' }, driverId: { userId: { name: 'Tariq' } }, vehicleId: { make: 'Toyota', model: 'Prado' }, tripType: 'city_day', pickupLocation: { address: 'Jhang' }, totalAmount: 10000, commission: 1500, status: 'pending', startDate: new Date().toISOString(), createdAt: new Date().toISOString() },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchBookings = () => {
    setLoading(true);
    api.get('/admin/bookings', { params: { status: status || undefined } })
      .then(r => setBookings(r.data.bookings))
      .catch(() => setBookings(MOCK))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [status]);

  const filtered = bookings.filter(b =>
    b.riderId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.pickupLocation?.address?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = filtered.reduce((sum, b) => sum + (b.commission || 0), 0);

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Bookings</h2>

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card orange">
          <div className="label">Commission Earned (shown)</div>
          <div className="value">PKR {totalCommission.toLocaleString()}</div>
        </div>
        <div className="stat-card blue">
          <div className="label">Showing Bookings</div>
          <div className="value">{filtered.length}</div>
        </div>
      </div>

      <div className="filters">
        <input placeholder="Search rider, location..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 260 }} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-header"><h2>All Bookings</h2></div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Rider</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Trip Type</th>
                <th>Pickup</th>
                <th>Amount</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>#{b._id.slice(-6).toUpperCase()}</td>
                  <td>{b.riderId?.name}</td>
                  <td>{b.driverId?.userId?.name || '—'}</td>
                  <td>{b.vehicleId?.make} {b.vehicleId?.model}</td>
                  <td>{b.tripType?.replace('_', ' ')}</td>
                  <td>{b.pickupLocation?.address}</td>
                  <td style={{ fontWeight: 700 }}>PKR {b.totalAmount?.toLocaleString()}</td>
                  <td style={{ color: '#1B5E20', fontWeight: 700 }}>PKR {b.commission?.toLocaleString()}</td>
                  <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                  <td style={{ fontSize: 12, color: '#6B7280' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
