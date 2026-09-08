import React, { useEffect, useState } from 'react';
import {
  Download,
  Database,
  Server,
  RefreshCw,
  Sun,
  Moon,
  Terminal,
  ArrowUpCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { HealthResponse } from '../types';

interface HeaderProps {
  onToast?: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({ onToast }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  // yt-dlp version management
  const [version, setVersion] = useState<string | null>(null);
  const [updatingYtDlp, setUpdatingYtDlp] = useState<boolean>(false);

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
      // Ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await api.checkHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchVersion = async () => {
    try {
      const res = await api.getYtDlpVersion();
      setVersion(res.current_version);
    } catch {
      setVersion(null);
    }
  };

  const handleUpdateYtDlp = async () => {
    if (updatingYtDlp) return;
    setUpdatingYtDlp(true);
    try {
      const res = await api.updateYtDlp();
      setVersion(res.current_version);
      if (onToast) {
        onToast(
          res.message || `yt-dlp updated to version v${res.current_version}`,
          'success'
        );
      }
    } catch (err) {
      if (onToast) {
        onToast(
          `Failed to update yt-dlp: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
          'error'
        );
      }
    } finally {
      setUpdatingYtDlp(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchVersion();

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
              <span className="brand-badge">PRO v2.0</span>
            </div>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* yt-dlp Version Badge & Quick Update Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              fontSize: '0.775rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Terminal size={14} color="var(--accent-purple)" />
            <span>yt-dlp {version ? `v${version}` : 'checking...'}</span>
            <button
              onClick={handleUpdateYtDlp}
              disabled={updatingYtDlp}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Update yt-dlp executable on backend (yt-dlp -U)"
            >
              {updatingYtDlp ? (
                <RefreshCw size={14} className="spinner" />
              ) : (
                <ArrowUpCircle size={14} />
              )}
            </button>
          </div>

          {/* Backend Health Status Badge */}
          <div className="health-badge">
            <div
              className={`health-dot ${
                loadingHealth ? 'loading' : isHealthy ? 'ok' : 'error'
              }`}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              API:
            </span>
            {loadingHealth ? (
              <span style={{ color: 'var(--text-muted)' }}>Checking...</span>
            ) : isHealthy ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  <RefreshCw size={14} className={loadingHealth ? 'spinner' : ''} />
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
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
