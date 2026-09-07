import React, { useState } from 'react';
import {
  Download,
  User,
  Clock,
  ExternalLink,
  Film,
  Music,
  Sparkles,
  Disc,
  Headphones,
  Sliders,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { VideoMetadata, DownloadFormatOption, FormatCategory } from '../types';

interface MetadataCardProps {
  metadata: VideoMetadata;
  source?: string;
  onEnqueueJob: (url: string, format: string, meta: VideoMetadata) => Promise<void>;
  enqueueing: boolean;
}

const ALL_FORMAT_OPTIONS: DownloadFormatOption[] = [
  // --- BEST / GENERAL ---
  {
    id: 'best',
    label: 'Best Quality',
    description: 'Auto-select highest quality video & audio',
    category: 'best',
    badge: 'Best',
    icon: 'sparkles',
  },
  // --- VIDEO FORMATS ---
  {
    id: 'mp4',
    label: 'MP4 Video',
    description: 'Universal MP4 format (H.264 / AAC)',
    category: 'video',
    badge: 'Video',
    icon: 'video',
  },
  {
    id: 'webm',
    label: 'WebM Video',
    description: 'High efficiency WebM container (VP9/AV1)',
    category: 'video',
    badge: 'Video',
    icon: 'film',
  },
  {
    id: '1080p',
    label: 'Full HD (1080p)',
    description: '1080p video stream + best audio',
    category: 'video',
    badge: 'Video',
    icon: 'video',
  },
  {
    id: '720p',
    label: 'HD Ready (720p)',
    description: '720p video stream + best audio',
    category: 'video',
    badge: 'Video',
    icon: 'video',
  },
  {
    id: '480p',
    label: 'SD (480p)',
    description: '480p resolution standard definition',
    category: 'video',
    badge: 'Video',
    icon: 'video',
  },
  {
    id: '360p',
    label: 'Low Res (360p)',
    description: 'Compact 360p size for low bandwidth',
    category: 'video',
    badge: 'Video',
    icon: 'video',
  },
  {
    id: 'bestvideo',
    label: 'Video Stream Only',
    description: 'Highest resolution video without audio track',
    category: 'video',
    badge: 'Video',
    icon: 'film',
  },
  // --- AUDIO FORMATS ---
  {
    id: 'mp3',
    label: 'Audio MP3 (320kbps)',
    description: 'High quality MP3 audio extraction',
    category: 'audio',
    badge: 'Audio',
    icon: 'audio',
  },
  {
    id: 'm4a',
    label: 'Audio M4A / AAC',
    description: 'Native M4A AAC audio container',
    category: 'audio',
    badge: 'Audio',
    icon: 'headphones',
  },
  {
    id: 'opus',
    label: 'Audio Opus (OGG)',
    description: 'Ultra high-efficiency Opus codec',
    category: 'audio',
    badge: 'Audio',
    icon: 'disc',
  },
  {
    id: 'flac',
    label: 'Audio FLAC (Lossless)',
    description: 'Uncompressed lossless audio format',
    category: 'audio',
    badge: 'Lossless',
    icon: 'disc',
  },
  {
    id: 'wav',
    label: 'Audio WAV (Lossless)',
    description: 'Studio quality uncompressed WAV audio',
    category: 'audio',
    badge: 'Lossless',
    icon: 'headphones',
  },
  {
    id: 'bestaudio',
    label: 'Best Raw Audio',
    description: 'Direct raw audio stream from source',
    category: 'audio',
    badge: 'Audio',
    icon: 'audio',
  },
];

export const MetadataCard: React.FC<MetadataCardProps> = ({
  metadata,
  source,
  onEnqueueJob,
  enqueueing,
}) => {
  const [activeCategory, setActiveCategory] = useState<FormatCategory>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('best');
  const [customFormatInput, setCustomFormatInput] = useState<string>('');

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'Live / Unknown';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartDownload = () => {
    const finalFormat =
      activeCategory === 'custom' && customFormatInput.trim()
        ? customFormatInput.trim()
        : selectedFormat;
    onEnqueueJob(metadata.url, finalFormat, metadata);
  };

  const filteredOptions = ALL_FORMAT_OPTIONS.filter((opt) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'video') return opt.category === 'video' || opt.category === 'best';
    if (activeCategory === 'audio') return opt.category === 'audio';
    return true;
  });

  return (
    <div className="glass-panel metadata-card">
      <div className="meta-content">
        {/* Thumbnail Preview */}
        <div className="thumb-container">
          <img
            src={
              metadata.thumbnail ||
              'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600'
            }
            alt={metadata.title}
            className="thumb-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600';
            }}
          />
          <div className="duration-badge">
            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {formatDuration(metadata.duration)}
          </div>
        </div>

        {/* Video Info Details */}
        <div className="meta-details">
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background:
                    source === 'cache'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(99, 102, 241, 0.15)',
                  color:
                    source === 'cache' ? 'var(--status-completed)' : 'var(--accent-cyan)',
                  border: `1px solid ${
                    source === 'cache'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(6, 182, 212, 0.3)'
                  }`,
                }}
              >
                {source === 'cache' ? '⚡ Cached Metadata' : '✨ Extracted Metadata'}
              </span>
            </div>

            <h2 className="meta-title">{metadata.title}</h2>
          </div>

          <div className="meta-info-row">
            <div className="info-item">
              <User size={15} color="var(--accent-primary)" />
              <span>{metadata.uploader || 'Unknown Channel'}</span>
            </div>
            <div className="info-item">
              <Clock size={15} color="var(--accent-cyan)" />
              <span>{formatDuration(metadata.duration)}</span>
            </div>
            <a
              href={metadata.url}
              target="_blank"
              rel="noreferrer"
              className="info-item"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
              <span>Open Source Link</span>
            </a>
          </div>
        </div>
      </div>

      {/* Format Category Selector Tabs */}
      <div className="format-selection">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div className="format-label">Select Download Format</div>

          {/* Category Filter Pills */}
          <div className="filter-tabs" style={{ background: 'var(--bg-card-hover)' }}>
            <button
              className={`tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <span>All Formats ({ALL_FORMAT_OPTIONS.length})</span>
            </button>
            <button
              className={`tab-btn ${activeCategory === 'video' ? 'active' : ''}`}
              onClick={() => setActiveCategory('video')}
            >
              <Film size={13} />
              <span>Video</span>
            </button>
            <button
              className={`tab-btn ${activeCategory === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveCategory('audio')}
            >
              <Music size={13} />
              <span>Audio Only</span>
            </button>
            <button
              className={`tab-btn ${activeCategory === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveCategory('custom')}
            >
              <Sliders size={13} />
              <span>Custom Code</span>
            </button>
          </div>
        </div>

        {/* Format Options Grid OR Custom Input */}
        {activeCategory === 'custom' ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
            >
              Custom yt-dlp Format Expression:
            </label>
            <input
              type="text"
              className="url-input"
              style={{ padding: '0.75rem 1rem' }}
              placeholder="e.g. bestvideo[height<=1080]+bestaudio/best or 137+140"
              value={customFormatInput}
              onChange={(e) => setCustomFormatInput(e.target.value)}
            />
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Pass raw <code>yt-dlp</code> format strings directly to the backend downloader worker.
            </div>
          </div>
        ) : (
          <div className="format-grid">
            {filteredOptions.map((opt) => {
              const isActive = selectedFormat === opt.id && activeCategory !== 'custom';
              return (
                <div
                  key={opt.id}
                  className={`format-option ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedFormat(opt.id)}
                >
                  <div className="format-opt-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {opt.icon === 'sparkles' && (
                        <Sparkles size={15} color="var(--accent-purple)" />
                      )}
                      {opt.icon === 'video' && <Film size={15} color="var(--accent-cyan)" />}
                      {opt.icon === 'audio' && (
                        <Music size={15} color="var(--status-completed)" />
                      )}
                      {opt.icon === 'film' && (
                        <Film size={15} color="var(--accent-primary)" />
                      )}
                      {opt.icon === 'disc' && <Disc size={15} color="var(--accent-pink)" />}
                      {opt.icon === 'headphones' && (
                        <Headphones size={15} color="var(--accent-cyan)" />
                      )}
                      <span className="format-opt-title">{opt.label}</span>
                    </div>
                    <span className="format-opt-desc">{opt.description}</span>
                  </div>
                  <span className={`format-badge ${opt.badge}`}>{opt.badge}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button
          className="btn-primary"
          onClick={handleStartDownload}
          disabled={enqueueing}
          style={{ width: '100%', maxWidth: '340px' }}
        >
          {enqueueing ? (
            <span>Enqueueing Download...</span>
          ) : (
            <>
              <Download size={18} />
              <span>
                Start Download (
                {activeCategory === 'custom'
                  ? customFormatInput.trim() || 'custom'
                  : selectedFormat}
                )
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
