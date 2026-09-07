import React, { useEffect, useState } from 'react';
import {
  getAllSubscriptions, markSubscriptionPaid, extendSubscription,
  getSubscriptionConfig, updateSubscriptionConfig, getSubscriptionStats, grantFreeMonthBulk,
} from '../api';

export default function SubscriptionsPage() {
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [mode, setMode] = useState('manual');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      getAllSubscriptions({ status: statusFilter !== 'all' ? statusFilter : undefined }),
      getSubscriptionStats(),
      getSubscriptionConfig(),
    ])
      .then(([driversRes, statsRes, configRes]) => {
        setDrivers(driversRes.data.drivers);
        setStats(statsRes.data.stats);
        setMode(configRes.data.subscriptionPaymentMode);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const handleToggleMode = async () => {
    const newMode = mode === 'manual' ? 'gateway' : 'manual';
    try {
      await updateSubscriptionConfig({ subscriptionPaymentMode: newMode });
      setMode(newMode);
    } catch { alert('Error updating payment mode'); }
  };

  const handleMarkPaid = async (driverId) => {
    const reference = prompt('Payment reference / note (optional):') || '';
    try {
      await markSubscriptionPaid(driverId, { months: 1, reference });
      fetchAll();
    } catch { alert('Error marking paid'); }
  };

  const handleExtend = async (driverId) => {
    const days = prompt('Extend by how many days?', '30');
    if (!days) return;
    try {
      await extendSubscription(driverId, { days: Number(days) });
      fetchAll();
    } catch { alert('Error extending subscription'); }
  };

  const handleGrantFreeMonth = async () => {
    if (!window.confirm('Grant the launch free month to every driver who has not used it yet?')) return;
    try {
      const res = await grantFreeMonthBulk();
      alert(`Granted free month to ${res.data.modifiedCount} driver(s).`);
      fetchAll();
    } catch { alert('Error granting free month'); }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Driver Subscriptions</h2>

      {stats && (
        <div className="stat-grid">
          <div className="stat-card green">
            <div className="label">Subscription Revenue (All Time)</div>
            <div className="value">PKR {stats.totalRevenue?.toLocaleString()}</div>
          </div>
          <div className="stat-card orange">
            <div className="label">This Month</div>
            <div className="value">PKR {stats.thisMonthRevenue?.toLocaleString()}</div>
          </div>
          <div className="stat-card blue">
            <div className="label">Active Subscriptions</div>
            <div className="value">{stats.activeDrivers}</div>
          </div>
          <div className="stat-card red">
            <div className="label">Expired</div>
            <div className="value">{stats.expiredDrivers}</div>
          </div>
        </div>
      )}

      <div className="table-card" style={{ marginBottom: 20 }}>
        <div className="table-header">
          <h2>Payment Mode</h2>
        </div>
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>Current mode: <strong>{mode === 'manual' ? 'Manual (admin-recorded)' : 'Gateway (online payment)'}</strong></span>
          <button className="btn btn-success btn-sm" onClick={handleToggleMode}>
            Switch to {mode === 'manual' ? 'Gateway' : 'Manual'}
          </button>
          <button className="btn btn-success btn-sm" onClick={handleGrantFreeMonth} style={{ marginLeft: 'auto' }}>
            🎁 Grant launch free month to all existing drivers
          </button>
        </div>
      </div>

      <div className="filters">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Subscriptions</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Drivers ({drivers.length})</h2>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver._id}>
                  <td><strong>{driver.userId?.name || '—'}</strong></td>
                  <td>{driver.userId?.phone}</td>
                  <td><span className={`badge ${driver.subscriptionStatus || 'none'}`}>{driver.subscriptionStatus || 'none'}</span></td>
                  <td style={{ fontSize: 12, color: '#6B7280' }}>
                    {driver.subscriptionExpiresAt ? new Date(driver.subscriptionExpiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(driver._id)}>💳 Mark Paid</button>
                      <button className="btn btn-success btn-sm" onClick={() => handleExtend(driver._id)}>+ Extend</button>
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
