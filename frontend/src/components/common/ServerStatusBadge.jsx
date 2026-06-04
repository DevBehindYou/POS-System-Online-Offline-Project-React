// src/components/common/ServerStatusBadge.jsx
//
// Polls /api/health every 8 seconds to detect backend status.
// Shows a compact badge in the navbar:
//   • Green dot  — backend online
//   • Amber dot  — first check pending
//   • Red dot + countdown — backend waking up (Render spin-down)
//
import React, { useEffect, useRef, useState, useCallback } from 'react';

const API_HEALTH_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/health`;
const POLL_INTERVAL_ONLINE  = 30_000; // re-check every 30 s when online
const POLL_INTERVAL_OFFLINE = 8_000;  // re-check every 8 s when offline
const WAKE_TIMEOUT          = 90;     // max seconds to show countdown

export default function ServerStatusBadge() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'waking'
  const [countdown, setCountdown] = useState(WAKE_TIMEOUT);
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef  = useRef(null);
  const countRef  = useRef(null);
  const wakingSince = useRef(null);

  // ── Clear all timers ──────────────────────────────────────────────
  const clearTimers = () => {
    if (timerRef.current)  clearTimeout(timerRef.current);
    if (countRef.current)  clearInterval(countRef.current);
  };

  // ── Countdown ticker (runs while waking) ─────────────────────────
  const startCountdown = useCallback(() => {
    if (countRef.current) return; // already running
    wakingSince.current = Date.now();
    setCountdown(WAKE_TIMEOUT);
    countRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - wakingSince.current) / 1000);
      const remaining = Math.max(0, WAKE_TIMEOUT - elapsed);
      setCountdown(remaining);
      if (remaining === 0) {
        clearInterval(countRef.current);
        countRef.current = null;
      }
    }, 1000);
  }, []);

  // ── Single health check ───────────────────────────────────────────
  const check = useCallback(async () => {
    try {
      const res = await fetch(API_HEALTH_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(6000), // 6 s request timeout
      });
      if (res.ok) {
        setStatus('online');
        // Stop countdown if it was running
        if (countRef.current) {
          clearInterval(countRef.current);
          countRef.current = null;
        }
        wakingSince.current = null;
        // Schedule next check
        timerRef.current = setTimeout(check, POLL_INTERVAL_ONLINE);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      setStatus('waking');
      startCountdown();
      timerRef.current = setTimeout(check, POLL_INTERVAL_OFFLINE);
    }
  }, [startCountdown]);

  useEffect(() => {
    check();
    return () => clearTimers();
  }, [check]);

  // ── Render ────────────────────────────────────────────────────────
  const dotBase = {
    width: '8px', height: '8px', borderRadius: '50%',
    flexShrink: 0, display: 'inline-block',
  };

  const configs = {
    checking: { dot: { ...dotBase, backgroundColor: '#f59e0b', opacity: 0.8 }, label: 'Checking…', color: 'var(--color-text-muted)' },
    online:   { dot: { ...dotBase, backgroundColor: '#22c55e' },               label: 'Server Online', color: '#22c55e' },
    waking:   { dot: { ...dotBase, backgroundColor: '#f87171' },               label: countdown > 0 ? `Starting… ${countdown}s` : 'Starting…', color: '#f87171' },
  };

  const { dot, label, color } = configs[status];

  return (
    <div
      id="server-status-badge"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge pill */}
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          cursor: 'default',
          transition: 'opacity 300ms',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
        title={label}
      >
        {/* Animated dot */}
        <span
          style={{
            ...dot,
            boxShadow: status === 'online'   ? '0 0 0 0 rgba(34,197,94,0.4)' :
                       status === 'waking'   ? '0 0 0 0 rgba(248,113,113,0.4)' : 'none',
            animation: status !== 'checking' ? `pulse-${status} 2s infinite` : 'none',
          }}
        />
        {/* Label — hide on very small screens */}
        <span
          className="hidden sm:inline"
          style={{ fontSize: '0.6875rem', fontWeight: 600, color, fontFamily: 'var(--font-sans)', letterSpacing: '0.01em' }}
        >
          {label}
        </span>

        {/* Spinner ring (only while checking or waking, on mobile where text is hidden) */}
        {status !== 'online' && (
          <span className="sm:hidden" style={{ display: 'inline-flex' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"
              style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25"/>
              <path d="M21 12a9 9 0 00-9-9"/>
            </svg>
          </span>
        )}
      </div>

      {/* Tooltip (full detail on hover) */}
      {showTooltip && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          color: 'var(--color-text)',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-md)',
          zIndex: 50,
          pointerEvents: 'none',
        }}>
          {status === 'online'   && '✅ Backend is online'}
          {status === 'checking' && '🔄 Checking backend connection…'}
          {status === 'waking'   && `⏳ Backend is waking up — Render free tier spins down after 15 min idle. Usually takes 30–60 s.`}
          {status === 'waking' && countdown > 0 && (
            <div style={{ marginTop: '0.25rem', color: '#f87171', fontWeight: 600 }}>
              Est. wait: ~{countdown}s
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse-online {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes pulse-waking {
          0%   { box-shadow: 0 0 0 0 rgba(248,113,113,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(248,113,113,0); }
          100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
