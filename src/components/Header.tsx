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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
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
            <Download size={20} />
          </div>
          <div className="brand-text-container">
            <span className="brand-title">YT-DLP Engine</span>
            <span className="brand-badge">PRO</span>
          </div>
        </a>

        <div className="header-controls">
          {/* yt-dlp Version Badge & Quick Update Button */}
          <div className="version-pill-badge">
            <Terminal size={13} color="var(--accent-purple)" />
            <span className="version-text">{version ? `v${version}` : 'v...'}</span>
            <button
              onClick={handleUpdateYtDlp}
              disabled={updatingYtDlp}
              className="version-update-btn"
              title="Update yt-dlp executable on backend (yt-dlp -U)"
            >
              {updatingYtDlp ? (
                <RefreshCw size={13} className="spinner" />
              ) : (
                <ArrowUpCircle size={13} />
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
            <span className="health-label">API:</span>
            {loadingHealth ? (
              <span style={{ color: 'var(--text-muted)' }}>...</span>
            ) : isHealthy ? (
              <div className="health-details">
                <span className="health-status-ok">ONLINE</span>
                <span className="health-sub-item" title={`PostgreSQL: ${health?.postgres}`}>
                  <Database
                    size={11}
                    color={health?.postgres === 'connected' ? '#10b981' : '#ef4444'}
                  />{' '}
                  <span className="hide-on-mobile">PG</span>
                </span>
                <span className="health-sub-item" title={`Redis: ${health?.redis}`}>
                  <Server
                    size={11}
                    color={health?.redis === 'connected' ? '#10b981' : '#ef4444'}
                  />{' '}
                  <span className="hide-on-mobile">Redis</span>
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="health-status-err">OFF</span>
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
                  <RefreshCw size={13} className={loadingHealth ? 'spinner' : ''} />
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
              <Sun size={17} color="var(--status-queued)" />
            ) : (
              <Moon size={17} color="var(--accent-primary)" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
