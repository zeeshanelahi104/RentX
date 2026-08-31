import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MOCK_REVENUE = {
  totalRevenue: 213000,
  totalCommission: 31950,
  thisMonth: 87000,
  thisMonthCommission: 13050,
  avgBookingValue: 7500,
  monthlyBreakdown: [
    { month: 'Jan 2026', revenue: 12000, commission: 1800, bookings: 8 },
    { month: 'Feb 2026', revenue: 18000, commission: 2700, bookings: 12 },
    { month: 'Mar 2026', revenue: 22000, commission: 3300, bookings: 15 },
    { month: 'Apr 2026', revenue: 31000, commission: 4650, bookings: 21 },
    { month: 'May 2026', revenue: 45000, commission: 6750, bookings: 30 },
    { month: 'Jun 2026', revenue: 87000, commission: 13050, bookings: 56 },
  ],
  byTripType: { city_day: 45000, intercity: 72000, wedding: 84000, airport: 12000 },
  byPaymentMethod: { cash: 156000, easypaisa: 34000, jazzcash: 23000 },
};

export default function RevenuePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/revenue').then(r => setData(r.data)).catch(() => setData(MOCK_REVENUE));
  }, []);

  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Loading...</div>;

  const barData = {
    labels: data.monthlyBreakdown?.map(m => m.month) || [],
    datasets: [
      { label: 'Total Revenue (PKR)', data: data.monthlyBreakdown?.map(m => m.revenue), backgroundColor: 'rgba(27,94,32,0.7)' },
      { label: 'Your Commission (PKR)', data: data.monthlyBreakdown?.map(m => m.commission), backgroundColor: 'rgba(245,127,23,0.7)' },
    ],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Revenue & Earnings</h2>

      <div className="stat-grid">
        <div className="stat-card green">
          <div className="label">Total Revenue (All Time)</div>
          <div className="value">PKR {data.totalRevenue?.toLocaleString()}</div>
        </div>
        <div className="stat-card orange">
          <div className="label">Your Commission (All Time)</div>
          <div className="value">PKR {data.totalCommission?.toLocaleString()}</div>
          <div className="sub">15% of total revenue</div>
        </div>
        <div className="stat-card green">
          <div className="label">This Month Revenue</div>
          <div className="value">PKR {data.thisMonth?.toLocaleString()}</div>
        </div>
        <div className="stat-card orange">
          <div className="label">This Month Commission</div>
          <div className="value">PKR {data.thisMonthCommission?.toLocaleString()}</div>
        </div>
        <div className="stat-card blue">
          <div className="label">Avg Booking Value</div>
          <div className="value">PKR {data.avgBookingValue?.toLocaleString()}</div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="chart-card">
        <h2>Monthly Revenue vs Commission</h2>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { ticks: { callback: v => `PKR ${(v/1000).toFixed(0)}k` } } } }} />
      </div>

      {/* Breakdown Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* By Trip Type */}
        <div className="table-card">
          <div className="table-header"><h2>Revenue by Trip Type</h2></div>
          <table>
            <thead><tr><th>Trip Type</th><th>Revenue</th><th>Commission</th></tr></thead>
            <tbody>
              {Object.entries(data.byTripType || {}).map(([type, rev]) => (
                <tr key={type}>
                  <td>{type.replace('_', ' ')}</td>
                  <td style={{ fontWeight: 700 }}>PKR {rev.toLocaleString()}</td>
                  <td style={{ color: '#1B5E20', fontWeight: 700 }}>PKR {(rev * 0.15).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Payment Method */}
        <div className="table-card">
          <div className="table-header"><h2>Revenue by Payment Method</h2></div>
          <table>
            <thead><tr><th>Method</th><th>Amount</th></tr></thead>
            <tbody>
              {Object.entries(data.byPaymentMethod || {}).map(([method, amount]) => (
                <tr key={method}>
                  <td>{method === 'cash' ? '💵 Cash' : method === 'easypaisa' ? '📱 EasyPaisa' : '📱 JazzCash'}</td>
                  <td style={{ fontWeight: 700 }}>PKR {amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="table-card">
        <div className="table-header"><h2>Monthly Breakdown</h2></div>
        <table>
          <thead><tr><th>Month</th><th>Bookings</th><th>Total Revenue</th><th>Your Commission</th><th>Driver Payouts</th></tr></thead>
          <tbody>
            {data.monthlyBreakdown?.map(m => (
              <tr key={m.month}>
                <td><strong>{m.month}</strong></td>
                <td>{m.bookings}</td>
                <td>PKR {m.revenue?.toLocaleString()}</td>
                <td style={{ color: '#1B5E20', fontWeight: 700 }}>PKR {m.commission?.toLocaleString()}</td>
                <td style={{ color: '#6B7280' }}>PKR {(m.revenue - m.commission)?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
