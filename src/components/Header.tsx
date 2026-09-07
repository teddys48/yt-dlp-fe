import React, { useEffect, useState } from 'react';
import { Download, Database, Server, RefreshCw, Sun, Moon } from 'lucide-react';
import { api } from '../services/api';
import { HealthResponse } from '../types';

export const Header: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Theme State (Dark / Light Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('yt_dlp_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('yt_dlp_theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.checkHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'ok';

  return (
    <header className="app-header">
      <div className="header-container">
        <a href="#" className="brand-logo">
          <div className="brand-icon">
            <Download size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">YT-DLP Engine</span>
              <span className="brand-badge">PRO v1.0</span>
            </div>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Backend Health Status Badge */}
          <div className="health-badge">
            <div
              className={`health-dot ${
                loading ? 'loading' : isHealthy ? 'ok' : 'error'
              }`}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              API System:
            </span>
            {loading ? (
              <span style={{ color: 'var(--text-muted)' }}>Checking...</span>
            ) : isHealthy ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: 'var(--status-completed)', fontWeight: 700 }}>
                  ONLINE
                </span>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                  }}
                  title={`PostgreSQL: ${health?.postgres}`}
                >
                  <Database
                    size={12}
                    color={health?.postgres === 'connected' ? '#10b981' : '#ef4444'}
                  />{' '}
                  PG
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                  }}
                  title={`Redis: ${health?.redis}`}
                >
                  <Server
                    size={12}
                    color={health?.redis === 'connected' ? '#10b981' : '#ef4444'}
                  />{' '}
                  Redis
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--status-failed)', fontWeight: 700 }}>
                  OFFLINE
                </span>
                <button
                  onClick={fetchHealth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                  }}
                  title="Retry connection"
                >
                  <RefreshCw size={14} className={loading ? 'spinner' : ''} />
                </button>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} color="var(--status-queued)" />
            ) : (
              <Moon size={18} color="var(--accent-primary)" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
