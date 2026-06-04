// src/pages/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// charts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n || 0)
  );

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // stats + lists
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // chart
  const [range, setRange] = useState('7d'); // '7d' | '30d' | '90d'
  const [series, setSeries] = useState({ labels: [], data: [] });
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    // load dashboard tiles/lists (not range-bound)
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiClient.getDashboardOverview();
        setDash(data);
      } catch (e) {
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    // load chart series by selected range
    const run = async () => {
      try {
        setChartLoading(true);
        const report = await apiClient.getSalesReport(range); // /api/reports/sales?range=7d/30d/90d
        const labels = report.series.map((p) => p.period);
        const data = report.series.map((p) => Number(p.revenue));
        setSeries({ labels, data });
      } catch {
        // soft fallback: keep whatever we already have
      } finally {
        setChartLoading(false);
      }
    };
    run();
  }, [range]);

  const chartTitle = useMemo(() => {
    if (range === '30d') return 'Sales Overview (Last 30 Days)';
    if (range === '90d') return 'Sales Overview (Last 90 Days)';
    return 'Sales Overview (Last 7 Days)';
  }, [range]);

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: chartTitle },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ` ${currency(ctx.parsed.y)} on ${series.labels[ctx.dataIndex]}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(v),
          },
        },
      },
    }),
    [chartTitle, series.labels]
  );

  const lineData = useMemo(
    () => ({
      labels: series.labels,
      datasets: [
        {
          label: 'Revenue',
          data: series.data,
          borderColor: 'rgba(59,130,246,1)',
          backgroundColor: 'rgba(59,130,246,0.15)',
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    }),
    [series]
  );

  const paymentBreakdown = useMemo(() => {
    // make a doughnut using dash.topProducts as placeholder if there’s no report
    // (you can wire a true payment breakdown later on the dashboard if you wish)
    if (!dash?.topProducts?.length) return null;
    const labels = dash.topProducts.map((p) => p.name);
    const data = dash.topProducts.map((p) => Number(p.revenue || 0));
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(59,130,246,0.6)',
            'rgba(16,185,129,0.6)',
            'rgba(249,115,22,0.6)',
            'rgba(168,85,247,0.6)',
            'rgba(234,179,8,0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [dash]);

  const refresh = async () => {
    // refresh both stats and chart
    try {
      setLoading(true);
      const data = await apiClient.getDashboardOverview();
      setDash(data);
    } finally {
      setLoading(false);
    }
    try {
      setChartLoading(true);
      const report = await apiClient.getSalesReport(range);
      setSeries({
        labels: report.series.map((p) => p.period),
        data: report.series.map((p) => Number(p.revenue)),
      });
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', borderRadius: '0.875rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Dashboard</h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Welcome back, {user?.name || user?.username}!
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="pos-input"
              style={{ width: 'auto', minWidth: '9rem' }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={refresh}
              className="pos-btn pos-btn-primary"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', backgroundColor: 'var(--color-warning-bg)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)', borderRadius: '0.625rem', fontSize: '0.875rem', color: 'var(--color-warning)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ height: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: "Today's Sales", value: currency(dash?.today?.revenue ?? dash?.stats?.todaySales), accent: 'accent-blue' },
                { label: 'Total Products', value: dash?.products?.total ?? dash?.stats?.totalProducts ?? 0, accent: 'accent-purple' },
                { label: 'Low Stock Items', value: dash?.products?.low_stock ?? dash?.stats?.lowStockItems ?? 0, accent: 'accent-red', danger: true },
                { label: 'Total Customers', value: dash?.customers?.total ?? dash?.stats?.totalCustomers ?? 0, accent: 'accent-green' },
              ].map(({ label, value, accent, danger }) => (
                <div key={label} className={`stat-card ${accent}`}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: danger ? 'var(--color-danger)' : 'var(--color-text)', lineHeight: 1.1 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="pos-card" style={{ padding: '1.25rem', gridColumn: 'span 2', minWidth: 0 }}>
                {chartLoading ? (
                  <div style={{ height: '16rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LoadingSpinner />
                  </div>
                ) : (
                  <Line options={lineOptions} data={lineData} height={90} />
                )}
              </div>

              <div className="pos-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  Top Products
                </h3>
                {paymentBreakdown ? (
                  <Doughnut data={paymentBreakdown} />
                ) : (
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', paddingTop: '1rem' }}>
                    Not enough data yet.
                  </div>
                )}
              </div>
            </div>

            {/* Lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="pos-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>Low Stock (≤ min)</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {(dash?.low_stock_products || dash?.lowStockProducts || []).map((p) => (
                    <li key={p.id || p._id} style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '1rem' }}>{p.name}</span>
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600, flexShrink: 0 }}>{p.stock_quantity ?? p.stock}</span>
                    </li>
                  ))}
                  {!(dash?.low_stock_products || dash?.lowStockProducts)?.length && (
                    <li style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No low stock items 🎉</li>
                  )}
                </ul>
              </div>

              <div className="pos-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>Recent Sales</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {(dash?.recent_sales || dash?.recentSales || []).map((s) => (
                    <li key={s.id || s._id} style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '1rem' }}>{s.customer_name || s.customer || 'Walk-in Customer'}</span>
                      <span style={{ color: 'var(--color-text)', fontWeight: 600, flexShrink: 0 }}>{currency(s.total_amount)}</span>
                    </li>
                  ))}
                  {!(dash?.recent_sales || dash?.recentSales)?.length && (
                    <li style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No sales yet.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pos-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'New Sale',    path: '/sales',           bg: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))', color: 'var(--color-primary)',   icon: 'M12 4v16m8-8H4' },
                  { label: 'Add Product', path: '/products?add=1',  bg: 'color-mix(in srgb, #16a34a 12%, var(--color-surface))',              color: '#16a34a',               icon: 'M20 7l-8-4-8 4m16 0l-8 4m0 10l8-4V7M4 7v10l8 4' },
                  { label: 'Add Customer',path: '/customers?add=1', bg: 'color-mix(in srgb, #9333ea 12%, var(--color-surface))',              color: '#9333ea',               icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                  { label: 'View Reports',path: '/reports',         bg: 'color-mix(in srgb, #ea580c 12%, var(--color-surface))',              color: '#ea580c',               icon: 'M9 19V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m8 0V5a2 2 0 012-2h2a2 2 0 012 2v14m-6 0a2 2 0 002 2h2a2 2 0 002-2' },
                ].map(({ label, path, bg, color, icon }) => (
                  <button key={label} onClick={() => navigate(path)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '1.25rem 0.5rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: bg, cursor: 'pointer', transition: 'transform 150ms, box-shadow 150ms', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <svg style={{ width: '1.75rem', height: '1.75rem', color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}/>
                    </svg>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
