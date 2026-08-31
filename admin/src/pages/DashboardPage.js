import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data.stats)).catch(() => {
      // Mock data for development when backend isn't set up
      setStats({
        totalBookings: 142, totalRevenue: 213000, commission: 31950,
        activeDrivers: 38, pendingVerification: 7, totalRiders: 89,
        todayBookings: 8, thisMonthRevenue: 87000,
        revenueChart: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], data: [12000,18000,22000,31000,45000,87000] },
        bookingsByStatus: { pending: 12, accepted: 8, active: 5, completed: 110, cancelled: 7 },
        topCities: [{ city: 'Chiniot', count: 72 }, { city: 'Faisalabad', count: 45 }, { city: 'Jhang', count: 25 }],
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>Loading...</div>;

  const chartData = {
    labels: stats.revenueChart?.labels || [],
    datasets: [{
      label: 'Revenue (PKR)',
      data: stats.revenueChart?.data || [],
      borderColor: '#1B5E20',
      backgroundColor: 'rgba(27,94,32,0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Dashboard Overview</h2>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card green">
          <div className="label">Total Revenue</div>
          <div className="value">PKR {stats.totalRevenue?.toLocaleString()}</div>
          <div className="sub">This month: PKR {stats.thisMonthRevenue?.toLocaleString()}</div>
        </div>
        <div className="stat-card orange">
          <div className="label">Platform Commission (15%)</div>
          <div className="value">PKR {stats.commission?.toLocaleString()}</div>
          <div className="sub">Your earnings</div>
        </div>
        <div className="stat-card blue">
          <div className="label">Total Bookings</div>
          <div className="value">{stats.totalBookings}</div>
          <div className="sub">Today: {stats.todayBookings}</div>
        </div>
        <div className="stat-card green">
          <div className="label">Active Drivers</div>
          <div className="value">{stats.activeDrivers}</div>
          <div className="sub">Pending verification: {stats.pendingVerification}</div>
        </div>
        <div className="stat-card blue">
          <div className="label">Total Riders</div>
          <div className="value">{stats.totalRiders}</div>
        </div>
        <div className="stat-card red">
          <div className="label">Pending Bookings</div>
          <div className="value">{stats.bookingsByStatus?.pending}</div>
          <div className="sub">Need driver response</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-card">
        <h2>Revenue Trend</h2>
        <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => `PKR ${v.toLocaleString()}` } } } }} />
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Booking Status */}
        <div className="table-card">
          <div className="table-header"><h2>Bookings by Status</h2></div>
          <table>
            <tbody>
              {Object.entries(stats.bookingsByStatus || {}).map(([status, count]) => (
                <tr key={status}>
                  <td><span className={`badge ${status}`}>{status}</span></td>
                  <td style={{ fontWeight: 700 }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Cities */}
        <div className="table-card">
          <div className="table-header"><h2>Top Cities</h2></div>
          <table>
            <tbody>
              {stats.topCities?.map(c => (
                <tr key={c.city}>
                  <td>📍 {c.city}</td>
                  <td style={{ fontWeight: 700 }}>{c.count} bookings</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
