import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UrlInputForm } from './components/UrlInputForm';
import { MetadataCard } from './components/MetadataCard';
import { JobList } from './components/JobList';
import { api } from './services/api';
import { VideoMetadata, Job } from './types';
import { AlertCircle, CheckCircle2, Info, Sparkles, Youtube, ShieldCheck } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const LOCAL_STORAGE_KEY = 'yt_dlp_fe_jobs_v1';

export const App: React.FC = () => {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [metadataSource, setMetadataSource] = useState<string>('extracted');
  const [metadataLoading, setMetadataLoading] = useState<boolean>(false);
  const [enqueueLoading, setEnqueueLoading] = useState<boolean>(false);

  // Load initial jobs from local storage
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Persist jobs to local storage
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
      const res = await api.enqueueJob(url, format);
      const newJob: Job = {
        ...res.job,
        metadata: meta || metadata || undefined,
      };

      setJobs((prev) => [newJob, ...prev]);
      addToast(`Job ${newJob.id.slice(0, 8)} successfully enqueued!`, 'success');

      // Clear metadata preview after enqueueing
      setMetadata(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to enqueue download job';
      addToast(msg, 'error');
    } finally {
      setEnqueueLoading(false);
    }
  };

  /**
   * Direct Quick Enqueue with default format
   */
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
    addToast('Job removed from history', 'info');
  };

  const handleClearCompleted = () => {
    setJobs((prev) => prev.filter((j) => j.status !== 'completed'));
    addToast('Cleared all completed jobs', 'info');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="main-wrapper">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">High Performance Media Downloader</h1>
          <p className="hero-subtitle">
            Extract high-definition video streams and audio tracks with real-time SSE progress updates, rate limiting, and Redis queue distribution.
          </p>
        </section>

        {/* Step 1: Input URL */}
        <UrlInputForm
          onFetchMetadata={handleFetchMetadata}
          onDirectEnqueue={handleDirectEnqueue}
          loading={metadataLoading}
        />

        {/* Step 2: Metadata Preview & Format Selector */}
        {metadata && (
          <MetadataCard
            metadata={metadata}
            source={metadataSource}
            onEnqueueJob={handleEnqueueJob}
            enqueueing={enqueueLoading}
          />
        )}

        {/* Step 3: Active Jobs List & Real-time Progress Streaming */}
        <JobList
          jobs={jobs}
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
          background: 'rgba(7, 9, 19, 0.9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} color="var(--accent-cyan)" /> SSRF & IP Security Protected
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--accent-purple)" /> Redis Job Queue & SSE Stream
          </span>
        </div>
      </footer>

      {/* Toast Notifications Overlay */}
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
