// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/* ─── Sun / Moon icons ─── */
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
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

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { login, loading, user, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  if (isAuthenticated || user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const result = await login(credentials.username, credentials.password);
      if (!result.success) setError(result.message || 'Login failed');
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        padding: '1rem',
        position: 'relative',
        transition: 'background-color 150ms',
      }}
    >
      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Background decoration */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-10rem', right: '-10rem',
          width: '28rem', height: '28rem', borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8rem', left: '-8rem',
          width: '22rem', height: '22rem', borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, #7c3aed 10%, transparent) 0%, transparent 70%)',
        }} />
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '26rem',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '1.25rem',
        boxShadow: 'var(--shadow-lg)',
        padding: '2.5rem 2rem',
        position: 'relative',
        zIndex: 1,
        transition: 'background-color 150ms, border-color 150ms',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
            borderRadius: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px color-mix(in srgb, var(--color-primary) 35%, transparent)',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em' }}>POS</span>
          </div>
          <h1 style={{
            margin: 0, fontSize: '1.625rem', fontWeight: 800,
            color: 'var(--color-text)', letterSpacing: '-0.02em',
          }}>
            Welcome back
          </h1>
          <p style={{ margin: '0.375rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Sign in to your POS account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Username */}
          <div>
            <label htmlFor="login-username" style={{
              display: 'block', marginBottom: '0.375rem',
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--color-text)',
            }}>
              Username
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="pos-input"
              placeholder="Enter your username"
              value={credentials.username}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" style={{
              display: 'block', marginBottom: '0.375rem',
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--color-text)',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="pos-input"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', padding: '0.25rem',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--color-danger)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.625rem',
              border: 'none',
              background: loading
                ? 'var(--color-surface-2)'
                : 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
              color: loading ? 'var(--color-text-muted)' : '#ffffff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
              boxShadow: loading ? 'none' : '0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent)',
              fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
                  <path d="M21 12a9 9 0 00-9-9"/>
                </svg>
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--color-surface-2)',
          borderRadius: '0.625rem',
          border: '1px solid var(--color-border)',
        }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Demo Credentials
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {[
              { role: 'Admin', user: 'admin', pass: 'admin123', color: 'var(--color-primary)' },
              { role: 'Cashier', user: 'cashier', pass: 'cashier123', color: '#10b981' },
            ].map(({ role, user: u, pass, color }) => (
              <button
                key={role}
                type="button"
                onClick={() => setCredentials({ username: u, password: pass })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  fontFamily: 'var(--font-sans)',
                }}
                title={`Fill ${role} credentials`}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color }}>
                  {role}
                </span>
                <code style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface-2)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '0.3rem',
                }}>
                  {u} / {pass}
                </code>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;