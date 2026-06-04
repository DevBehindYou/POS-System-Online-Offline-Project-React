// frontend/src/pages/reports/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, BarElement, ArcElement);

// Themed chart palette
const PALETTE = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#fb923c', '#4ade80'];
const LINE_COLOR  = '#818cf8';
const AREA_COLOR  = 'rgba(129,140,248,0.12)';
const BAR_COLOR   = '#34d399';

const RangeButton = ({ value, current, onClick, children }) => (
  <button
    onClick={() => onClick(value)}
    style={{
      padding: '0.375rem 0.875rem',
      borderRadius: '0.5rem',
      fontSize: '0.8125rem',
      fontWeight: current === value ? 600 : 500,
      border: '1px solid var(--color-border)',
      backgroundColor: current === value ? 'var(--color-primary)' : 'var(--color-surface)',
      color: current === value ? '#ffffff' : 'var(--color-text-muted)',
      cursor: 'pointer',
      transition: 'all 150ms',
      fontFamily: 'var(--font-sans)',
    }}
  >
    {children}
  </button>
);

const KpiCard = ({ label, value, accent }) => (
  <div className={`stat-card ${accent}`}>
    <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.1 }}>{value}</div>
  </div>
);

export default function Reports() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr('');
        const r = await apiClient.getSalesReport(range);
        setData(r);
      } catch (e) { setErr(e?.message || 'Failed to load report'); }
      finally { setLoading(false); }
    })();
  }, [range]);

  const labels       = useMemo(() => (data?.series || []).map(s => s.period), [data]);
  const revenueSeries = useMemo(() => (data?.series || []).map(s => Number(s.revenue)), [data]);
  const ordersSeries  = useMemo(() => (data?.series || []).map(s => Number(s.orders)), [data]);
  const paymentLabels = useMemo(() => (data?.payments || []).map(p => p.method.toUpperCase()), [data]);
  const paymentValues = useMemo(() => (data?.payments || []).map(p => Number(p.revenue)), [data]);
  const k = data?.kpis || { revenue: 0, orders: 0, avgOrder: 0, tax: 0, discounts: 0 };

  const downloadCsv = async () => {
    try {
      const blob = await apiClient.exportSalesReport(range, 'csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `sales_${range}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { alert(e?.message || 'Export failed'); }
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 11 } } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 10, cornerRadius: 8 }
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}><LoadingSpinner /></div>;

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          {data?.bounds && (
            <p className="page-subtitle">
              {new Date(data.bounds.start).toLocaleDateString()} – {new Date(data.bounds.end).toLocaleDateString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <RangeButton value="7d"  current={range} onClick={setRange}>7 days</RangeButton>
          <RangeButton value="30d" current={range} onClick={setRange}>30 days</RangeButton>
          <RangeButton value="6m"  current={range} onClick={setRange}>6 months</RangeButton>
          <button onClick={downloadCsv} className="pos-btn pos-btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
          {err}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <KpiCard label="Revenue"    value={`$${Number(k.revenue).toFixed(2)}`}   accent="accent-blue" />
        <KpiCard label="Orders"     value={k.orders}                              accent="accent-green" />
        <KpiCard label="Avg. Order" value={`$${Number(k.avgOrder).toFixed(2)}`}  accent="accent-purple" />
        <KpiCard label="Tax"        value={`$${Number(k.tax).toFixed(2)}`}        accent="accent-orange" />
        <KpiCard label="Discounts"  value={`-$${Number(k.discounts).toFixed(2)}`} accent="accent-red" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '1rem' }}>
        <div className="pos-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1rem' }}>Revenue Over Time</div>
          <div style={{ height: '18rem' }}>
            <Line data={{ labels, datasets: [{ label: 'Revenue', data: revenueSeries, borderColor: LINE_COLOR, backgroundColor: AREA_COLOR, borderWidth: 2, tension: 0.35, fill: true, pointRadius: 2 }] }} options={chartOpts} />
          </div>
        </div>

        <div className="pos-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1rem' }}>Payment Breakdown</div>
          <div style={{ height: '18rem' }}>
            <Doughnut
              data={{ labels: paymentLabels, datasets: [{ data: paymentValues, backgroundColor: paymentLabels.map((_, i) => PALETTE[i % PALETTE.length]), borderWidth: 0, borderRadius: 4 }] }}
              options={{ ...chartOpts, plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 12 } } } } }}
            />
          </div>
        </div>
      </div>

      {/* Orders bar chart */}
      <div className="pos-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1rem' }}>Orders Over Time</div>
        <div style={{ height: '16rem' }}>
          <Bar data={{ labels, datasets: [{ label: 'Orders', data: ordersSeries, backgroundColor: BAR_COLOR, borderRadius: 6, barPercentage: 0.7, categoryPercentage: 0.7 }] }} options={chartOpts} />
        </div>
      </div>

      {/* Top Products table */}
      <div className="pos-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1rem' }}>Top Products</div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th style={{ textAlign: 'right' }}>Qty Sold</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topProducts || []).length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No product sales in this range.</td></tr>
              ) : (data?.topProducts || []).map((p, i) => (
                <tr key={p._id || p.id || p.name}>
                  <td style={{ color: 'var(--color-text-muted)', fontWeight: 600, width: '2.5rem' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{p.qty ?? p.quantity ?? 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>${Number(p.revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
