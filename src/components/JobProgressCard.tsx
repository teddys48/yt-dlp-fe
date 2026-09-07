import React, { useEffect, useState } from 'react';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  HardDrive,
  Copy,
  ExternalLink,
  Ban,
  Film,
  Music,
} from 'lucide-react';
import { Job, SSEProgressData } from '../types';
import { api } from '../services/api';

interface JobProgressCardProps {
  initialJob: Job;
  onUpdateJob: (updated: Job) => void;
  onRemoveJob?: (jobId: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const JobProgressCard: React.FC<JobProgressCardProps> = ({
  initialJob,
  onUpdateJob,
  onRemoveJob,
  onToast,
}) => {
  const [job, setJob] = useState<Job>(initialJob);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Sync internal job state when parent updates
  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  // Subscribe to SSE stream for real-time progress updates if job is active
  useEffect(() => {
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return;
    }

    // Connect to backend Server-Sent Events stream: /api/v1/jobs/:id/progress
    const unsubscribe = api.subscribeJobProgress(
      job.id,
      (data: SSEProgressData) => {
        setJob((prev) => {
          const updated: Job = {
            ...prev,
            status: data.status || prev.status,
            progress: typeof data.progress === 'number' ? data.progress : prev.progress,
            speed: data.speed || prev.speed,
            eta: data.eta || prev.eta,
            error: data.error || prev.error,
          };
          onUpdateJob(updated);
          return updated;
        });

        if (data.status === 'completed') {
          onToast(`Download completed for "${job.metadata?.title || job.id.slice(0, 8)}"`, 'success');
        } else if (data.status === 'failed') {
          onToast(`Download failed for "${job.metadata?.title || job.id.slice(0, 8)}"`, 'error');
        }
      },
      () => {
        // SSE error fallback: poll via REST API
        pollJobStatus();
      }
    );

    // Also set up a lightweight polling timer every 4 seconds as a fallback
    const pollInterval = setInterval(() => {
      pollJobStatus();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [job.id, job.status]);

  const pollJobStatus = async () => {
    try {
      const res = await api.getJobStatus(job.id);
      if (res.job) {
        setJob((prev) => {
          const merged = { ...prev, ...res.job };
          onUpdateJob(merged);
          return merged;
        });
      }
    } catch {
      // Ignore polling errors
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await api.cancelJob(job.id);
      onToast(`Cancellation request sent for job ${job.id.slice(0, 8)}`, 'info');
      setJob((prev) => {
        const updated: Job = { ...prev, status: 'cancelled' };
        onUpdateJob(updated);
        return updated;
      });
    } catch (err) {
      onToast(`Failed to cancel job: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const copyFilePath = () => {
    if (job.file_path) {
      navigator.clipboard.writeText(job.file_path);
      onToast('File path copied to clipboard!', 'info');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle2 size={16} color="var(--status-completed)" />;
      case 'failed':
        return <AlertCircle size={16} color="var(--status-failed)" />;
      case 'processing':
        return <Zap size={16} color="var(--accent-cyan)" className="spinner" />;
      case 'cancelled':
        return <XCircle size={16} color="var(--status-cancelled)" />;
      case 'queued':
      default:
        return <Clock size={16} color="var(--status-queued)" />;
    }
  };

  const displayProgress = Math.min(100, Math.max(0, job.progress || 0));

  return (
    <div className="glass-panel job-card">
      <div className="job-header-row">
        <div className="job-title-group">
          {job.metadata?.thumbnail ? (
            <img
              src={job.metadata.thumbnail}
              alt=""
              style={{
                width: '52px',
                height: '42px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          ) : (
            <div className="job-media-icon">
              {job.format.includes('mp3') || job.format.includes('audio') ? (
                <Music size={20} />
              ) : (
                <Film size={20} />
              )}
            </div>
          )}

          <div className="job-info">
            <div className="job-url-title" title={job.metadata?.title || job.url}>
              {job.metadata?.title || job.url}
            </div>
            <div className="job-submeta">
              <span>Format: <strong style={{ color: 'var(--text-main)' }}>{job.format}</strong></span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>ID: {job.id.slice(0, 8)}</span>
              {job.created_at && (
                <>
                  <span>•</span>
                  <span>{new Date(job.created_at).toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={`job-status-pill ${job.status}`}>
            {getStatusIcon()}
            <span>{job.status}</span>
          </div>

          {(job.status === 'queued' || job.status === 'processing') && (
            <button
              className="btn-secondary"
              onClick={handleCancel}
              disabled={cancelling}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--status-failed)' }}
              title="Cancel Job"
            >
              <Ban size={14} />
              <span>{cancelling ? 'Cancelling...' : 'Cancel'}</span>
            </button>
          )}

          {onRemoveJob && (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
            <button
              onClick={() => onRemoveJob(job.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Remove from history"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Live Stats Section */}
      <div className="progress-container">
        <div className="progress-info-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {displayProgress.toFixed(1)}%
            </span>
            {job.status === 'processing' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                • Streaming Progress
              </span>
            )}
          </div>

          <div className="progress-metrics">
            {job.speed && (
              <div className="progress-metric-item" title="Download Speed">
                <Zap size={13} color="var(--accent-cyan)" />
                <span>{job.speed}</span>
              </div>
            )}
            {job.eta && (
              <div className="progress-metric-item" title="Estimated Time Remaining">
                <Clock size={13} color="var(--status-queued)" />
                <span>ETA {job.eta}</span>
              </div>
            )}
            {job.file_size && (
              <div className="progress-metric-item" title="File Size">
                <HardDrive size={13} color="var(--accent-purple)" />
                <span>{formatFileSize(job.file_size)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Animated Progress Bar */}
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${job.status}`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      {/* Error Details Output */}
      {job.error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.6rem 0.8rem',
            fontSize: '0.8rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={15} color="var(--status-failed)" />
          <span>Error: {job.error}</span>
        </div>
      )}

      {/* Completed File Details Footer */}
      {job.status === 'completed' && (job.file_name || job.file_path) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1rem',
            fontSize: '0.825rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <Download size={15} color="var(--status-completed)" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>File Saved:</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {job.file_name || job.file_path}
            </span>
          </div>

          {job.file_path && (
            <button
              className="btn-secondary"
              onClick={copyFilePath}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <Copy size={13} />
              <span>Copy Path</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
