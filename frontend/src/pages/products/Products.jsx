// frontend/src/pages/products/Products.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const S = {
  label: { display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' },
  input: { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', outline: 'none' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' },
};

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', min_stock: '', barcode: '', category_id: '' });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [prodsRes, catsRes] = await Promise.all([apiClient.getProducts(), apiClient.getCategories()]);
        // Handle both array and {products:[]} response shapes
        const prods = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.products || prodsRes?.data || []);
        const cats  = Array.isArray(catsRes)  ? catsRes  : (catsRes?.categories || catsRes?.data || []);
        setProducts(prods);
        setCategories(cats);
      } catch (e) { setError('Failed to load products: ' + (e?.message || e)); console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProducts();
      setProducts(Array.isArray(data) ? data : (data?.products || data?.data || []));
    } catch (e) { setError('Failed to fetch products'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!formData.name.trim()) return setError('Product name is required');
    if (formData.price === '' || isNaN(Number(formData.price))) return setError('Price must be a number');
    if (formData.stock === '' || isNaN(Number(formData.stock))) return setError('Stock must be a number');
    const payload = {
      name: formData.name.trim(), description: formData.description?.trim() || null,
      price: Number(formData.price), stock: Number(formData.stock),
      min_stock: formData.min_stock === '' ? 5 : Number(formData.min_stock),
      barcode: formData.barcode?.trim() || null,
      category_id: formData.category_id || null,
    };
    try {
      if (editingProduct) await apiClient.updateProduct(editingProduct._id || editingProduct.id, payload);
      else await apiClient.createProduct(payload);
      resetForm(); fetchProducts();
    } catch (e) { setError(e?.message || 'Save failed'); }
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name, description: p.description || '', price: String(p.price ?? ''),
      stock: String(p.stock ?? ''), min_stock: String(p.minStock ?? p.min_stock ?? ''),
      barcode: p.barcode || '', category_id: String(p.categoryId || p.category_id || ''),
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await apiClient.deleteProduct(id); fetchProducts(); }
    catch { setError('Failed to delete product'); }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '', min_stock: '', barcode: '', category_id: '' });
    setEditingProduct(null); setShowAddModal(false); setError('');
  };

  const saveCategoryQuick = async () => {
    const name = (newCatName || '').trim();
    if (!name) { setCatError('Category name is required'); return; }
    setCatError(''); setCatSaving(true);
    try {
      await apiClient.createCategory({ name });
      const updated = await apiClient.getCategories();
      setCategories(updated || []);
      const created = (updated || []).find(c => c.name.toLowerCase() === name.toLowerCase());
      if (created) setFormData(f => ({ ...f, category_id: String(created._id || created.id) }));
      setShowCategoryModal(false); setNewCatName('');
    } catch (e) { setCatError(e.message || 'Failed to add category'); }
    finally { setCatSaving(false); }
  };

  const filteredProducts = (products || []).filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}><LoadingSpinner /></div>;

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your inventory · {products.length} products</p>
        </div>
        {user?.role === 'admin' && (
          <button id="add-product-btn" onClick={() => setShowAddModal(true)} className="pos-btn pos-btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add Product
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      {/* Search bar */}
      <div className="pos-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search by name or barcode…" className="pos-input" style={{ paddingLeft: '2.5rem' }}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {filteredProducts.length} of {products.length} shown
          </span>
        </div>
      </div>

      {/* Product cards grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <svg style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--color-border)' }} width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p>{products.length === 0 ? 'No products yet. Add your first product!' : 'No products match your search.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {filteredProducts.map((product) => {
            const id = product._id || product.id;
            const isLow = product.stock <= (product.minStock ?? product.min_stock ?? 5);
            const catName = product.category_name || categories.find(c => (c._id || c.id) === (product.categoryId || product.category_id))?.name || null;
            return (
              <div key={id} className="pos-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{product.name}</h3>
                  <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>{isLow ? 'Low Stock' : 'In Stock'}</span>
                </div>

                {product.description && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
                  <div style={S.row}><span style={{ color: 'var(--color-text-muted)' }}>Price</span><span style={{ fontWeight: 600, color: 'var(--color-text)' }}>${parseFloat(product.price).toFixed(2)}</span></div>
                  <div style={S.row}><span style={{ color: 'var(--color-text-muted)' }}>Stock</span><span style={{ fontWeight: 600, color: isLow ? 'var(--color-danger)' : 'var(--color-text)' }}>{product.stock}</span></div>
                  {product.barcode && <div style={S.row}><span style={{ color: 'var(--color-text-muted)' }}>Barcode</span><code style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-surface-2)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', color: 'var(--color-text)' }}>{product.barcode}</code></div>}
                  {catName && <div style={S.row}><span style={{ color: 'var(--color-text-muted)' }}>Category</span><span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{catName}</span></div>}
                </div>

                {user?.role === 'admin' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button onClick={() => handleEdit(product)} className="pos-btn pos-btn-ghost" style={{ flex: 1, fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}>Edit</button>
                    <button onClick={() => handleDelete(id)} className="pos-btn pos-btn-danger" style={{ flex: 1, fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}>Delete</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="modal-box" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={S.label}>Product Name *</label><input type="text" required className="pos-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div><label style={S.label}>Description</label><textarea className="pos-input" rows="2" style={{ resize: 'vertical' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={S.label}>Price *</label><input type="number" step="0.01" required className="pos-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} /></div>
                <div><label style={S.label}>Stock *</label><input type="number" required className="pos-input" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={S.label}>Min Stock</label><input type="number" className="pos-input" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} /></div>
                <div>
                  <label style={S.label}>Category</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="pos-input" value={formData.category_id || ''} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                      <option value="">None</option>
                      {categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" className="pos-btn pos-btn-ghost" style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                      onClick={() => { setNewCatName(''); setCatError(''); setShowCategoryModal(true); }}>+ New</button>
                  </div>
                </div>
              </div>

              <div><label style={S.label}>Barcode</label><input type="text" className="pos-input" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} /></div>

              {error && <div style={{ padding: '0.625rem 0.875rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="pos-btn pos-btn-primary" style={{ flex: 1 }}>{editingProduct ? 'Update' : 'Add Product'}</button>
                <button type="button" className="pos-btn pos-btn-ghost" style={{ flex: 1 }} onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Category Modal */}
      {showCategoryModal && (
        <div className="modal-backdrop" style={{ zIndex: 60 }} onClick={e => e.target === e.currentTarget && setShowCategoryModal(false)}>
          <div className="modal-box" style={{ maxWidth: '22rem', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text)' }}>Add Category</h3>
            <input className="pos-input" style={{ marginBottom: '0.75rem' }} value={newCatName} placeholder="Category name" onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveCategoryQuick()} />
            {catError && <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>{catError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="pos-btn pos-btn-ghost" onClick={() => setShowCategoryModal(false)}>Cancel</button>
              <button className="pos-btn pos-btn-primary" onClick={saveCategoryQuick} disabled={catSaving}>{catSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
