import React, { useEffect, useState, useRef } from 'react';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  Copy,
  Ban,
  Film,
  Music,
  FileText,
  Sparkles,
  HardDrive,
  Trash2,
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
  const autoDownloadedRef = useRef<boolean>(false);

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  /**
   * Triggers file download directly via GET /api/v1/jobs/:id/file
   * Backend serves Content-Disposition: attachment; filename="..."
   */
  const executeDownload = (jobId: string, fileName?: string) => {
    try {
      const fileUrl = api.getFileUrl(jobId);
      const link = document.createElement('a');
      link.href = fileUrl;
      if (fileName) {
        link.download = fileName;
      }
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);
    } catch (err) {
      console.error('Download file trigger error:', err);
    }
  };

  // Subscribe to SSE stream for real-time progress updates if job is active
  useEffect(() => {
    if (
      job.status === 'completed' ||
      job.status === 'failed' ||
      job.status === 'cancelled' ||
      job.status === 'cleaned'
    ) {
      return;
    }

    const unsubscribe = api.subscribeJobProgress(
      job.id,
      (data: SSEProgressData) => {
        setJob((prev) => {
          const updated: Job = {
            ...prev,
            status: data.status || prev.status,
            progress: typeof data.progress === 'number' ? data.progress : prev.progress,
            title: data.title || prev.title,
            file_name: data.file_name || prev.file_name,
            extension: data.extension || prev.extension,
            file_size: data.file_size || prev.file_size,
            speed: data.speed || prev.speed,
            eta: data.eta || prev.eta,
            error: data.error || prev.error,
          };
          onUpdateJob(updated);
          return updated;
        });

        if (data.status === 'completed') {
          onToast(
            `Download completed for "${data.file_name || data.title || job.id.slice(0, 8)}"`,
            'success'
          );

          // Auto-download trigger when completed
          if (!autoDownloadedRef.current) {
            autoDownloadedRef.current = true;
            executeDownload(job.id, data.file_name);
            onToast('Download started automatically!', 'info');
          }
        } else if (data.status === 'failed') {
          onToast(
            `Download failed for "${job.metadata?.title || job.id.slice(0, 8)}"`,
            'error'
          );
        }
      },
      () => {
        pollJobStatus();
      }
    );

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

          if (
            merged.status === 'completed' &&
            !autoDownloadedRef.current
          ) {
            autoDownloadedRef.current = true;
            executeDownload(merged.id, merged.file_name);
            onToast('Download started automatically!', 'info');
          }

          return merged;
        });
      }
    } catch {
      // Ignore
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
      onToast(
        `Failed to cancel job: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
        'error'
      );
    } finally {
      setCancelling(false);
    }
  };

  const copyFileDownloadUrl = () => {
    const downloadUrl = api.getFileUrl(job.id);
    navigator.clipboard.writeText(downloadUrl);
    onToast('File download endpoint URL copied to clipboard!', 'info');
  };

  const handleManualDownload = () => {
    executeDownload(job.id, job.file_name);
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
      case 'cleaned':
        return <Trash2 size={16} color="var(--text-dim)" />;
      case 'queued':
      default:
        return <Clock size={16} color="var(--status-queued)" />;
    }
  };

  const displayProgress = Math.min(100, Math.max(0, job.progress || 0));
  const displayTitle = job.file_name || job.title || job.metadata?.title || job.url;
  const displayThumbnail = job.metadata?.thumbnail;

  return (
    <div className="glass-panel job-card">
      <div className="job-header-row">
        <div className="job-title-group">
          {displayThumbnail ? (
            <img
              src={displayThumbnail}
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
              {job.format.includes('mp3') ||
              job.format.includes('audio') ||
              job.extension === 'opus' ||
              job.extension === 'mp3' ||
              job.extension === 'm4a' ||
              job.extension === 'flac' ? (
                <Music size={20} />
              ) : (
                <Film size={20} />
              )}
            </div>
          )}

          <div className="job-info">
            <div
              className="job-url-title"
              title={job.file_name || displayTitle}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>{displayTitle}</span>
              {job.extension && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  .{job.extension}
                </span>
              )}
            </div>
            <div className="job-submeta">
              <span>
                Format:{' '}
                <strong style={{ color: 'var(--text-main)' }}>{job.format}</strong>
              </span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                ID: {job.id.slice(0, 8)}
              </span>
              {job.client_ip && (
                <>
                  <span>•</span>
                  <span>IP: {job.client_ip}</span>
                </>
              )}
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
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                color: 'var(--status-failed)',
              }}
              title="Cancel Job"
            >
              <Ban size={14} />
              <span>{cancelling ? 'Cancelling...' : 'Cancel'}</span>
            </button>
          )}

          {onRemoveJob &&
            (job.status === 'completed' ||
              job.status === 'failed' ||
              job.status === 'cancelled' ||
              job.status === 'cleaned') && (
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

      {/* Progress Bar & Streaming Stats */}
      <div className="progress-container">
        <div className="progress-info-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {displayProgress.toFixed(1)}%
            </span>
            {job.status === 'processing' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                • Downloading & Converting Media
              </span>
            )}
          </div>

          <div className="progress-metrics">
            {job.speed && (
              <div className="progress-metric-item" title="Speed">
                <Zap size={13} color="var(--accent-cyan)" />
                <span>{job.speed}</span>
              </div>
            )}
            {job.eta && (
              <div className="progress-metric-item" title="ETA">
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

      {/* Error Output */}
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

      {/* Cleaned Status Banner */}
      {job.status === 'cleaned' && (
        <div
          style={{
            background: 'rgba(107, 114, 128, 0.1)',
            border: '1px solid rgba(107, 114, 128, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1rem',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Trash2 size={15} color="var(--text-dim)" />
          <span>File auto-cleaned after 24 hours retention period.</span>
        </div>
      )}

      {/* Completed File Serving Download Action Card */}
      {job.status === 'completed' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.825rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <FileText size={18} color="var(--status-completed)" />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={job.file_name || displayTitle}
              >
                {job.file_name || displayTitle}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>Ready for download</span>
                {job.file_size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(job.file_size)}</span>
                  </>
                )}
                <span>•</span>
                <span style={{ color: 'var(--accent-cyan)' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '2px' }} />
                  24h Retention
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn-secondary"
              onClick={copyFileDownloadUrl}
              style={{ fontSize: '0.775rem', padding: '0.45rem 0.8rem' }}
              title="Copy backend download endpoint URL"
            >
              <Copy size={14} />
              <span>Copy Link</span>
            </button>

            <button
              className="btn-primary"
              onClick={handleManualDownload}
              style={{
                fontSize: '0.775rem',
                padding: '0.45rem 0.95rem',
              }}
              title="Download file directly from backend server"
            >
              <Download size={14} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
