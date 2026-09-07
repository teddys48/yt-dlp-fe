import React, { useState } from 'react';
import { DownloadCloud, Trash2, Search, Filter, Layers } from 'lucide-react';
import { Job } from '../types';
import { JobProgressCard } from './JobProgressCard';

interface JobListProps {
  jobs: Job[];
  onUpdateJob: (job: Job) => void;
  onRemoveJob: (jobId: string) => void;
  onClearCompleted: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

type FilterTab = 'all' | 'active' | 'completed' | 'failed';

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onUpdateJob,
  onRemoveJob,
  onClearCompleted,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeJobsCount = jobs.filter(
    (j) => j.status === 'queued' || j.status === 'processing'
  ).length;
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length;
  const failedJobsCount = jobs.filter(
    (j) => j.status === 'failed' || j.status === 'cancelled'
  ).length;

  const filteredJobs = jobs.filter((j) => {
    // Filter by Tab
    if (activeTab === 'active' && !(j.status === 'queued' || j.status === 'processing')) {
      return false;
    }
    if (activeTab === 'completed' && j.status !== 'completed') {
      return false;
    }
    if (activeTab === 'failed' && !(j.status === 'failed' || j.status === 'cancelled')) {
      return false;
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = j.metadata?.title?.toLowerCase().includes(q);
      const urlMatch = j.url.toLowerCase().includes(q);
      const idMatch = j.id.toLowerCase().includes(q);
      return titleMatch || urlMatch || idMatch;
    }

    return true;
  });

  return (
    <div className="jobs-section">
      <div className="jobs-header">
        <h2 className="section-title">
          <DownloadCloud size={24} color="var(--accent-primary)" />
          <span>Download Queue & Tasks</span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Tab Filter Pills */}
          <div className="filter-tabs">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All</span>
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
              className={`tab-btn ${activeTab === 'failed' ? 'active' : ''}`}
              onClick={() => setActiveTab('failed')}
            >
              <span>Failed</span>
              {failedJobsCount > 0 && <span className="tab-count">{failedJobsCount}</span>}
            </button>
          </div>

          {completedJobsCount > 0 && (
            <button
              className="btn-secondary"
              onClick={onClearCompleted}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              title="Clear completed tasks"
            >
              <Trash2 size={14} />
              <span>Clear Completed</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Job List or Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-icon">
            <Layers size={28} />
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>
            {jobs.length === 0
              ? 'No active download jobs yet'
              : 'No downloads matching selected filter'}
          </div>
          <div style={{ fontSize: '0.875rem', maxWidth: '380px' }}>
            {jobs.length === 0
              ? 'Paste a video URL in the input field above and click Fetch Info to start your download queue.'
              : 'Try changing the status tab or clearing your search filter.'}
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
