// src/pages/dashboard/CashierDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

function isToday(iso) {
  const d = new Date(iso); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function CashierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setErr('');
        const [ov, salesList] = await Promise.all([apiClient.getDashboardOverview(), apiClient.getSales()]);
        setOverview(ov);
        setSales(Array.isArray(salesList) ? salesList : salesList?.sales || []);
      } catch (e) { setErr(e?.message || 'Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const ordersToday = useMemo(() => sales.filter(s => isToday(s.created_at || s.createdAt)).length, [sales]);
  const avgOrderToday = useMemo(() => {
    const todays = sales.filter(s => isToday(s.created_at || s.createdAt));
    if (!todays.length) return 0;
    return todays.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) / todays.length;
  }, [sales]);

  const recentSales = overview?.recent_sales || overview?.recentSales || [];
  const lowStock    = overview?.low_stock_products || overview?.lowStockProducts || [];
  const todaySales  = overview?.today?.revenue ?? overview?.stats?.todaySales ?? 0;
  const lowStockCnt = overview?.products?.low_stock ?? overview?.stats?.lowStockItems ?? 0;

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Cashier Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name || user?.username}.</p>
        </div>
        <button className="pos-btn pos-btn-primary" onClick={() => navigate('/sales')}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Sale
        </button>
      </div>

      {err && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-warning-bg)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--color-warning)' }}>{err}</div>
      )}

      {loading ? (
        <div style={{ height: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>
      ) : (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: "Today's Sales", value: currency(todaySales), accent: 'accent-blue' },
              { label: 'Orders Today',  value: ordersToday,          accent: 'accent-green' },
              { label: 'Avg Order',     value: currency(avgOrderToday), accent: 'accent-purple' },
              { label: 'Low Stock',     value: lowStockCnt,          accent: 'accent-red', danger: true },
            ].map(({ label, value, accent, danger }) => (
              <div key={label} className={`stat-card ${accent}`}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: danger ? 'var(--color-danger)' : 'var(--color-text)', lineHeight: 1.1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Start New Sale', path: '/sales',    bg: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))', color: 'var(--color-primary)' },
              { label: 'Lookup Product', path: '/products', bg: 'color-mix(in srgb, #16a34a 12%, var(--color-surface))',              color: '#16a34a' },
              { label: 'Find Customer', path: '/customers', bg: 'color-mix(in srgb, #9333ea 12%, var(--color-surface))',              color: '#9333ea' },
            ].map(({ label, path, bg, color }) => (
              <button key={label} onClick={() => navigate(path)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: bg, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color, transition: 'transform 150ms, box-shadow 150ms', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                {label}
              </button>
            ))}
          </div>

          {/* Recent + Low Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="pos-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Recent Receipts</h3>
                <button onClick={() => navigate('/sales')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-primary)', fontFamily: 'var(--font-sans)' }}>Open Sales →</button>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {recentSales.map(s => (
                  <li key={s._id || s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{s.customer_name || s.customer || 'Walk-in'}</span>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.4rem', fontSize: '0.75rem' }}>#{s.invoice_number || s.id}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)', flexShrink: 0 }}>{currency(s.total_amount)}</span>
                  </li>
                ))}
                {!recentSales.length && <li style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No sales yet.</li>}
              </ul>
            </div>

            <div className="pos-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Low Stock Alert</h3>
                <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-primary)', fontFamily: 'var(--font-sans)' }}>View All →</button>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {lowStock.map(p => (
                  <li key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>{p.name}</span>
                    <span style={{ color: 'var(--color-danger)', fontWeight: 700, flexShrink: 0 }}>{p.stock_quantity ?? p.stock}</span>
                  </li>
                ))}
                {!lowStock.length && <li style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>All good 🎉</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
