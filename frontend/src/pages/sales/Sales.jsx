// frontend/src/pages/sales/Sales.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 150ms',
};

const labelStyle = {
  display: 'block', marginBottom: '0.375rem',
  fontSize: '0.875rem', fontWeight: 500,
  color: 'var(--color-text)',
};

export default function Sales() {
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [custSaving, setCustSaving] = useState(false);

  const [cart, setCart] = useState([]);
  const [taxPct, setTaxPct] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const cs = await api.getCustomers();
        setCustomers(Array.isArray(cs) ? cs : cs?.customers || []);
      } catch (e) { console.warn('Customers load:', e?.message); }
    })();
  }, []);

  const doSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true); setShowResults(true);
    try { const data = await api.searchProducts(q); setResults(data || []); }
    catch { setResults([]); }
    finally { setSearching(false); }
  };

  const handleSearchKey = async (e) => { if (e.key === 'Enter') { e.preventDefault(); await doSearch(); } };

  const addToCart = (p) => {
    const pid = p._id || p.id;
    setCart(prev => {
      const idx = prev.findIndex(it => it.id === pid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(Number(p.stock), Number(next[idx].qty) + 1) };
        return next;
      }
      return [...prev, { id: pid, name: p.name, price: Number(p.price), stock: Number(p.stock), qty: 1, barcode: p.barcode || '' }];
    });
    setQuery(''); searchRef.current?.focus(); setShowResults(false); setResults([]);
  };

  const updateQty = (id, qty) => setCart(prev => prev.map(it => it.id !== id ? it : { ...it, qty: Math.max(1, Math.min(Number(it.stock), Number(qty) || 1)) }));
  const removeItem = (id) => setCart(prev => prev.filter(it => it.id !== id));

  const subtotal = useMemo(() => round2(cart.reduce((s, it) => s + it.price * it.qty, 0)), [cart]);
  const taxAmount = useMemo(() => round2(subtotal * (Number(taxPct) || 0) / 100), [subtotal, taxPct]);
  const discountAmount = useMemo(() => round2(subtotal * (Number(discountPct) || 0) / 100), [subtotal, discountPct]);
  const total = useMemo(() => Math.max(0, round2(subtotal + taxAmount - discountAmount)), [subtotal, taxAmount, discountAmount]);

  const resetSale = () => { setCart([]); setCustomerId(''); setTaxPct(0); setDiscountPct(0); setPaymentMethod('cash'); setNote(''); setError(''); setSuccessInfo(null); setQuery(''); setResults([]); setShowResults(false); };

  const submitSale = async () => {
    setError('');
    if (!cart.length) return setError('Add at least one product to the cart.');
    for (const it of cart) {
      if (it.qty < 1) return setError(`Invalid quantity for ${it.name}`);
      if (it.qty > it.stock) return setError(`Quantity exceeds stock for ${it.name}`);
    }
    const payload = {
      items: cart.map(it => ({ product_id: it.id, quantity: Number(it.qty), unit_price: Number(it.price) })),
      customer_id: customerId || null, tax_rate: Number(taxPct) || 0,
      discount_amount: discountAmount, payment_method: paymentMethod,
    };
    setSubmitting(true);
    try {
      const res = await api.createSale(payload);
      setSuccessInfo({ saleId: res?.sale?.id || res?.id, invoiceNumber: res?.sale?.invoice_number, total });
      setCart(prev => prev.map(it => ({ ...it, stock: it.stock - it.qty })));
    } catch (e) { setError(e?.message || 'Sale failed'); }
    finally { setSubmitting(false); }
  };

  const saveCustomerQuick = async () => {
    const name = (newCustomer.name || '').trim();
    if (!name) return;
    setCustSaving(true);
    try {
      const created = await api.createCustomer({ name, email: newCustomer.email || null, phone: newCustomer.phone || null, address: null });
      const refreshed = await api.getCustomers();
      const list = Array.isArray(refreshed) ? refreshed : refreshed?.customers || [];
      setCustomers(list);
      const id = created?.customerId || created?.id;
      if (id) setCustomerId(String(id));
      setShowCustomerModal(false); setNewCustomer({ name: '', email: '', phone: '' });
    } catch (e) { alert(e?.message || 'Failed to add customer'); }
    finally { setCustSaving(false); }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales / POS</h1>
          <p className="page-subtitle">Scan or search products, build a cart, and complete the sale.</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {successInfo && (
        <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>✅ Sale completed! Invoice <strong>{successInfo.invoiceNumber || `#${successInfo.saleId}`}</strong> · Total: <strong>${(successInfo.total || 0).toFixed(2)}</strong></span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="pos-btn pos-btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }} onClick={() => window.print()}>Print</button>
            <button className="pos-btn pos-btn-primary" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }} onClick={resetSale}>New Sale</button>
          </div>
        </div>
      )}

      {/* Main layout — single column on mobile/tablet, 2-col on desktop */}
      <div className="sales-grid" style={{ display: 'grid', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left: Search + Cart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          {/* Product search */}
          <div className="pos-card" style={{ padding: '1.25rem' }}>
            <label style={labelStyle}>Scan barcode or search product</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={searchRef} value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Type barcode or product name, then press Enter…"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button className="pos-btn pos-btn-primary" onClick={doSearch} disabled={!query.trim() || searching} style={{ whiteSpace: 'nowrap' }}>
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>

            {showResults && (
              <div style={{ marginTop: '0.75rem', maxHeight: '15rem', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}>
                {results.length === 0 ? (
                  <div style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>{searching ? 'Searching…' : 'No results found'}</div>
                ) : results.map(p => (
                  <div key={p._id || p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', transition: 'background-color 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        ${Number(p.price).toFixed(2)} · Stock: {p.stock}{p.barcode ? ` · ${p.barcode}` : ''}
                      </div>
                    </div>
                    <button className="pos-btn pos-btn-primary" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }} onClick={() => addToCart(p)}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="pos-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Cart <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({cart.length} items)</span>
              </h3>
              {cart.length > 0 && <button className="pos-btn pos-btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.625rem', color: 'var(--color-danger)' }} onClick={() => setCart([])}>Clear</button>}
            </div>

            {cart.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <svg style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--color-border)' }} width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Cart is empty. Search or scan to add items.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(it => {
                      const line = round2(it.price * it.qty);
                      const over = it.qty > it.stock;
                      return (
                        <tr key={it.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{it.name}</div>
                            {it.barcode && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{it.barcode}</div>}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>${it.price.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <input type="number" min="1" max={it.stock} value={it.qty}
                              onChange={e => updateQty(it.id, e.target.value)}
                              style={{ width: '5rem', padding: '0.3rem 0.5rem', textAlign: 'right', border: `1px solid ${over ? 'var(--color-danger)' : 'var(--color-border)'}`, borderRadius: '0.375rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none' }}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>${line.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer + Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {/* Customer */}
          <div className="pos-card" style={{ padding: '1.25rem' }}>
            <label style={labelStyle}>Customer (optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select style={{ ...inputStyle, flex: 1 }} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {customers.map(c => {
                  const id = c._id || c.id;
                  return <option key={id} value={id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>;
                })}
              </select>
              <button className="pos-btn pos-btn-ghost" style={{ whiteSpace: 'nowrap', padding: '0.5rem 0.75rem' }} onClick={() => setShowCustomerModal(true)}>+ Add</button>
            </div>
          </div>

          {/* Totals */}
          <div className="pos-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>Order Summary</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>${subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                Tax %
                <input type="number" min="0" max="100" value={taxPct} onChange={e => setTaxPct(e.target.value)}
                  style={{ width: '4.5rem', padding: '0.3rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', textAlign: 'right' }} />
              </label>
              <span style={{ color: 'var(--color-text-muted)' }}>+${taxAmount.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                Discount %
                <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)}
                  style={{ width: '4.5rem', padding: '0.3rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none', textAlign: 'right' }} />
              </label>
              <span style={{ color: 'var(--color-success)' }}>-${discountAmount.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid var(--color-border)', fontSize: '1.0625rem', fontWeight: 700 }}>
              <span style={{ color: 'var(--color-text)' }}>Total</span>
              <span style={{ color: 'var(--color-primary)' }}>${total.toFixed(2)}</span>
            </div>

            <div>
              <label style={labelStyle}>Payment Method</label>
              <select style={inputStyle} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Note (optional)</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Any note for receipt…" />
            </div>

            <button
              className="pos-btn pos-btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 700, justifyContent: 'center', marginTop: '0.25rem' }}
              disabled={!cart.length || submitting}
              onClick={submitSale}
            >
              {submitting ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/><path d="M21 12a9 9 0 00-9-9"/></svg> Processing…</>
              ) : `Complete Sale · $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCustomerModal(false)}>
          <div className="modal-box" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>Add Customer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Name *</label><input className="pos-input" value={newCustomer.name} onChange={e => setNewCustomer(c => ({ ...c, name: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Email</label><input type="email" className="pos-input" value={newCustomer.email} onChange={e => setNewCustomer(c => ({ ...c, email: e.target.value }))} /></div>
                <div><label style={labelStyle}>Phone</label><input className="pos-input" value={newCustomer.phone} onChange={e => setNewCustomer(c => ({ ...c, phone: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.25rem' }}>
                <button className="pos-btn pos-btn-ghost" onClick={() => setShowCustomerModal(false)}>Cancel</button>
                <button className="pos-btn pos-btn-primary" onClick={saveCustomerQuick} disabled={!newCustomer.name.trim() || custSaving}>
                  {custSaving ? 'Saving…' : 'Save Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
