// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
  Outlet,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import CashierDashboard from './pages/dashboard/CashierDashboard';
import Products from './pages/products/Products';
import Categories from './pages/settings/Categories';
import SalesPage from './pages/sales/Sales';
import CustomersPage from './pages/customers/Customers';
import ReportsPage from './pages/reports/Reports';

/* ─────────────────────────────────────────────
   Sun / Moon icons (inline SVG)
───────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Theme Toggle Button
───────────────────────────────────────────── */
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className="theme-toggle"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Role switcher
───────────────────────────────────────────── */
function DashboardSwitch() {
  const { user } = useAuth();
  return user?.role === 'cashier' ? <CashierDashboard /> : <Dashboard />;
}

/* ─────────────────────────────────────────────
   Navigation config
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', adminOnly: false,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
  },
  { name: 'Products', href: '/products', adminOnly: false,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
  },
  { name: 'Sales', href: '/sales', adminOnly: false,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
  },
  { name: 'Customers', href: '/customers', adminOnly: false,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
  },
  { name: 'Reports', href: '/reports', adminOnly: true,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
  },
];

/* ─────────────────────────────────────────────
   Mobile Hamburger
───────────────────────────────────────────── */
function HamburgerIcon({ open }) {
  return open ? (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   App Shell — themed, mobile-ready
───────────────────────────────────────────── */
function AppShell() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  const userInitial = (user?.name || user?.username || '?').charAt(0).toUpperCase();
  const roleColor = user?.role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500';

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      {/* ── Top Navigation Bar ── */}
      <nav
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderBottom: '1px solid var(--nav-border)',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          transition: 'background-color 150ms, border-color 150ms',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '3.5rem', gap: '1rem' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
              <div style={{
                width: '2rem', height: '2rem',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
                borderRadius: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>POS</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--nav-text)', letterSpacing: '-0.01em' }}>
                POS System
              </span>
            </div>

            {/* Desktop Nav Links — visible only at lg (1024px+) */}
            <div className="hidden lg:flex" style={{ alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
              {visibleNav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--nav-text-muted)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 150ms',
                    whiteSpace: 'nowrap',
                  })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.getAttribute('aria-current')) {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-2)';
                      e.currentTarget.style.color = 'var(--nav-text)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.getAttribute('aria-current')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--nav-text-muted)';
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User avatar + name — visible only at lg (1024px+) */}
              <div className="hidden lg:flex" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '2rem', height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: user?.role === 'admin' ? 'var(--color-primary)' : '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.8125rem',
                  flexShrink: 0,
                }}>
                  {userInitial}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--nav-text)' }}>
                    {user?.name || user?.username}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--nav-text-muted)', textTransform: 'capitalize' }}>
                    {user?.role}
                  </div>
                </div>
              </div>

              {/* Logout button — visible only at lg (1024px+) */}
              <button
                id="logout-btn"
                onClick={logout}
                className="hidden lg:inline-flex pos-btn pos-btn-danger"
                style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>

              {/* Hamburger — shown on mobile & tablet (< 1024px)
                  NOTE: NO display:'flex' in style — let Tailwind's lg:hidden control visibility */}
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="lg:hidden"
                aria-label="Toggle menu"
                style={{
                  padding: '0.4rem',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--nav-text-muted)',
                  cursor: 'pointer',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 150ms',
                }}
              >
                <HamburgerIcon open={mobileMenuOpen} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--nav-bg)',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            {visibleNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--nav-text)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  textDecoration: 'none',
                })}
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}

            {/* Mobile user + logout */}
            <div style={{
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '2rem', height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: user?.role === 'admin' ? 'var(--color-primary)' : '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.8125rem',
                }}>
                  {userInitial}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--nav-text)' }}>
                    {user?.name || user?.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--nav-text-muted)', textTransform: 'capitalize' }}>
                    {user?.role}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.4rem 0.875rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Page Content ── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.5rem 1rem',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: '0.875rem 1rem',
        transition: 'background-color 150ms, border-color 150ms',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            © {new Date().getFullYear()} POS System · Built with React &amp; MongoDB Atlas
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-subtle)' }}>
            <span>v1.1.0</span>
            <span>·</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   App Root
───────────────────────────────────────────── */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardSwitch />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings/categories" element={<Categories />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
