import React, { useState, useEffect } from 'react';
import { DownloadCloud, Trash2, Layers, RefreshCw, UserCheck, Search } from 'lucide-react';
import { Job } from '../types';
import { JobProgressCard } from './JobProgressCard';
import { api } from '../services/api';

interface JobListProps {
  jobs: Job[];
  clientIp?: string;
  onUpdateJob: (job: Job) => void;
  onRemoveJob: (jobId: string) => void;
  onClearCompleted: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

type FilterTab = 'all' | 'active' | 'completed' | 'ip_history';

export const JobList: React.FC<JobListProps> = ({
  jobs,
  clientIp: initialClientIp,
  onUpdateJob,
  onRemoveJob,
  onClearCompleted,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [ipHistoryJobs, setIpHistoryJobs] = useState<Job[]>([]);
  const [targetIp, setTargetIp] = useState<string>(initialClientIp || '');
  const [loadingIpHistory, setLoadingIpHistory] = useState<boolean>(false);

  useEffect(() => {
    if (initialClientIp && !targetIp) {
      setTargetIp(initialClientIp);
    }
  }, [initialClientIp]);

  const activeJobsCount = jobs.filter(
    (j) => j.status === 'queued' || j.status === 'processing'
  ).length;
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length;

  const fetchIpHistory = async (ipQuery?: string) => {
    setLoadingIpHistory(true);
    const queryIp = ipQuery !== undefined ? ipQuery : targetIp;
    try {
      const res = await api.getMyDownloads(queryIp);
      if (res.client_ip) setTargetIp(res.client_ip);
      setIpHistoryJobs(res.jobs || []);
      onToast(`Loaded ${res.jobs?.length || 0} downloads for IP ${res.client_ip || queryIp || 'client'}`, 'info');
    } catch (err) {
      onToast(
        `Failed to fetch IP history: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
        'error'
      );
    } finally {
      setLoadingIpHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ip_history') {
      fetchIpHistory();
    }
  }, [activeTab]);

  const displayedJobs = activeTab === 'ip_history' ? ipHistoryJobs : jobs;

  const filteredJobs = displayedJobs.filter((j) => {
    if (activeTab === 'active') {
      return j.status === 'queued' || j.status === 'processing';
    }
    if (activeTab === 'completed') {
      return j.status === 'completed';
    }
    return true;
  });

  return (
    <div className="jobs-section">
      <div className="jobs-header">
        <h2 className="section-title">
          <DownloadCloud size={24} color="var(--accent-primary)" />
          <span>Download Queue & History</span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Tab Filter Pills */}
          <div className="filter-tabs">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>Current Session</span>
              <span className="tab-count">{jobs.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <span>Active</span>
              {activeJobsCount > 0 && <span className="tab-count">{activeJobsCount}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              <span>Completed</span>
              {completedJobsCount > 0 && <span className="tab-count">{completedJobsCount}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === 'ip_history' ? 'active' : ''}`}
              onClick={() => setActiveTab('ip_history')}
            >
              <UserCheck size={14} />
              <span>IP History</span>
              {targetIp && <span className="tab-count">{ipHistoryJobs.length}</span>}
            </button>
          </div>

          {activeTab === 'ip_history' && (
            <button
              className="btn-secondary"
              onClick={() => fetchIpHistory()}
              disabled={loadingIpHistory}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              title="Refresh IP Download History"
            >
              <RefreshCw size={14} className={loadingIpHistory ? 'spinner' : ''} />
              <span>Refresh History</span>
            </button>
          )}

          {activeTab !== 'ip_history' && completedJobsCount > 0 && (
            <button
              className="btn-secondary"
              onClick={onClearCompleted}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              title="Clear completed tasks from current session"
            >
              <Trash2 size={14} />
              <span>Clear Completed</span>
            </button>
          )}
        </div>
      </div>

      {/* IP Search Banner when viewing IP History */}
      {activeTab === 'ip_history' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '240px' }}>
            <UserCheck size={18} color="var(--accent-cyan)" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              Target Client IP:
            </span>
            <input
              type="text"
              className="url-input"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.825rem',
                fontFamily: 'var(--font-mono)',
                height: '32px',
              }}
              placeholder="e.g. 203.0.113.195 or leave blank for self"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchIpHistory(targetIp);
              }}
            />
            <button
              className="btn-secondary"
              onClick={() => fetchIpHistory(targetIp)}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
            >
              <Search size={13} />
              <span>Query IP</span>
            </button>
          </div>

          <div style={{ fontSize: '0.775rem', whiteSpace: 'nowrap' }}>
            Total Recorded: <strong style={{ color: 'var(--accent-primary)' }}>{ipHistoryJobs.length}</strong>
          </div>
        </div>
      )}

      {/* Render Job List or Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-icon">
            <Layers size={28} />
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>
            {activeTab === 'ip_history'
              ? `No download history recorded for IP ${targetIp || 'client'}`
              : jobs.length === 0
              ? 'No active download jobs yet'
              : 'No downloads matching selected filter'}
          </div>
          <div style={{ fontSize: '0.875rem', maxWidth: '380px' }}>
            {jobs.length === 0
              ? 'Paste a video URL in the input field above and click Fetch Info to start your download queue.'
              : 'Try changing the status tab or querying a different client IP.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredJobs.map((job) => (
            <JobProgressCard
              key={job.id}
              initialJob={job}
              onUpdateJob={onUpdateJob}
              onRemoveJob={onRemoveJob}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};
