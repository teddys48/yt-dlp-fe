import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UrlInputForm } from './components/UrlInputForm';
import { MetadataCard } from './components/MetadataCard';
import { JobList } from './components/JobList';
import { api } from './services/api';
import { VideoMetadata, Job } from './types';
import { AlertCircle, CheckCircle2, Info, Sparkles, ShieldCheck, HardDrive, Globe } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const LOCAL_STORAGE_KEY = 'yt_dlp_fe_jobs_v2';

export const App: React.FC = () => {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [metadataSource, setMetadataSource] = useState<string>('extracted');
  const [metadataLoading, setMetadataLoading] = useState<boolean>(false);
  const [enqueueLoading, setEnqueueLoading] = useState<boolean>(false);
  const [clientIp, setClientIp] = useState<string>('');

  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Auto-detect public client IP on startup
  useEffect(() => {
    const detectIp = async () => {
      const detectedIp = await api.fetchPublicIp();
      if (detectedIp) {
        setClientIp(detectedIp);
      }
    };
    detectIp();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobs));
    } catch (err) {
      console.warn('Failed to save jobs to localStorage:', err);
    }
  }, [jobs]);

  const addToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  /**
   * Fetch Video Metadata: POST /api/v1/metadata
   */
  const handleFetchMetadata = async (url: string) => {
    setMetadataLoading(true);
    setMetadata(null);
    try {
      const res = await api.extractMetadata(url);
      setMetadata(res.metadata);
      setMetadataSource(res.source || 'extracted');
      addToast(`Metadata extracted for "${res.metadata.title}"`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to extract video metadata';
      addToast(msg, 'error');
    } finally {
      setMetadataLoading(false);
    }
  };

  /**
   * Enqueue Download Job: POST /api/v1/jobs
   */
  const handleEnqueueJob = async (
    url: string,
    format: string,
    meta?: VideoMetadata
  ) => {
    setEnqueueLoading(true);
    try {
      const res = await api.enqueueJob(url, format, clientIp);
      const newJob: Job = {
        ...res.job,
        metadata: meta || metadata || undefined,
        client_ip: res.job.client_ip || clientIp,
      };

      setJobs((prev) => [newJob, ...prev]);
      addToast(`Job ${newJob.id.slice(0, 8)} enqueued for downloading!`, 'success');

      setMetadata(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to enqueue job';
      addToast(msg, 'error');
    } finally {
      setEnqueueLoading(false);
    }
  };

  const handleDirectEnqueue = async (url: string) => {
    await handleEnqueueJob(url, 'best');
  };

  const handleUpdateJob = (updatedJob: Job) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === updatedJob.id ? { ...j, ...updatedJob } : j))
    );
  };

  const handleRemoveJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    addToast('Job removed from queue history', 'info');
  };

  const handleClearCompleted = () => {
    setJobs((prev) => prev.filter((j) => j.status !== 'completed'));
    addToast('Cleared completed jobs', 'info');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onToast={addToast} />

      <main className="main-wrapper">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">High Performance Media Downloader</h1>
          <p className="hero-subtitle">
            Download high-definition video streams and audio tracks with real-time SSE progress updates, 24h automatic cleanup, and per-IP history logging.
          </p>
          {clientIp && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.775rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                marginTop: '0.5rem',
                color: 'var(--text-muted)',
              }}
            >
              <Globe size={13} color="var(--accent-cyan)" />
              <span>Client IP: {clientIp}</span>
            </div>
          )}
        </section>

        {/* Input Form */}
        <UrlInputForm
          onFetchMetadata={handleFetchMetadata}
          onDirectEnqueue={handleDirectEnqueue}
          loading={metadataLoading}
        />

        {/* Metadata Card */}
        {metadata && (
          <MetadataCard
            metadata={metadata}
            source={metadataSource}
            onEnqueueJob={handleEnqueueJob}
            enqueueing={enqueueLoading}
          />
        )}

        {/* Jobs List */}
        <JobList
          jobs={jobs}
          clientIp={clientIp}
          onUpdateJob={handleUpdateJob}
          onRemoveJob={handleRemoveJob}
          onClearCompleted={handleClearCompleted}
          onToast={addToast}
        />
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-color)',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.85rem',
          background: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HardDrive size={16} color="var(--status-completed)" /> File Download Serving & Original Titles
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} color="var(--accent-cyan)" /> SSRF Security Protection
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Globe size={16} color="var(--accent-purple)" /> Per-IP History & Payload Options
          </span>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'error' && <AlertCircle size={18} color="var(--status-failed)" />}
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--status-completed)" />}
            {toast.type === 'info' && <Info size={18} color="var(--accent-primary)" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
