// frontend/src/pages/customers/Customers.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import apiClient from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const labelStyle = { display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' };

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => { fetchCustomers(); }, [searchQuery]);

  const fetchCustomers = async () => {
    setLoading(true); setError('');
    try {
      const q = searchQuery.trim();
      const data = q ? await apiClient.searchCustomers(q) : await apiClient.getCustomers();
      setCustomers(Array.isArray(data) ? data : data?.customers || []);
    } catch (err) { setError(err?.message || 'Failed to fetch customers'); setCustomers([]); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => [c.name, c.email, c.phone, c.address].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [customers, searchQuery]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', address: c.address || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setSaving(false); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      const id = editing?._id || editing?.id;
      if (editing) await apiClient.updateCustomer(id, { name: form.name.trim(), email: form.email || null, phone: form.phone || null, address: form.address || null });
      else await apiClient.createCustomer({ name: form.name.trim(), email: form.email || null, phone: form.phone || null, address: form.address || null });
      await fetchCustomers(); closeModal();
    } catch (err) { setError(err?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await apiClient.deleteCustomer(id); setCustomers(prev => prev.filter(c => (c._id || c.id) !== id)); }
    catch (err) { alert(err?.message || 'Delete failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}><LoadingSpinner /></div>;

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} customer{customers.length !== 1 ? 's' : ''} total</p>
        </div>
        <button id="add-customer-btn" onClick={openCreate} className="pos-btn pos-btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Customer
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div className="pos-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="pos-input" style={{ paddingLeft: '2.5rem' }} />
        </div>
      </div>

      {/* Customer Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                  No customers found.
                </td>
              </tr>
            ) : filtered.map(c => {
              const id = c._id || c.id;
              const initial = (c.name || '?').charAt(0).toUpperCase();
              return (
                <tr key={id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                        {initial}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{c.email || '—'}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{c.phone || '—'}</td>
                  <td style={{ color: 'var(--color-text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="pos-btn pos-btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }} onClick={() => openEdit(c)}>Edit</button>
                      <button className="pos-btn pos-btn-danger" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }} onClick={() => handleDelete(id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>{editing ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input className="pos-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Email</label><input type="email" className="pos-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><label style={labelStyle}>Phone</label><input className="pos-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <textarea rows="3" className="pos-input" style={{ resize: 'vertical' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              {error && <div style={{ padding: '0.625rem 0.875rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="pos-btn pos-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="pos-btn pos-btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Customers = () => (
  <Routes>
    <Route index element={<CustomersList />} />
  </Routes>
);

export default Customers;
