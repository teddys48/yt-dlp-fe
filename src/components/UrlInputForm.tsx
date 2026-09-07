import React, { useState } from 'react';
import { Link2, Clipboard, Loader2, Sparkles, ArrowRight, X } from 'lucide-react';

interface UrlInputFormProps {
  onFetchMetadata: (url: string) => Promise<void>;
  onDirectEnqueue: (url: string) => Promise<void>;
  loading: boolean;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  onFetchMetadata,
  onDirectEnqueue,
  loading,
}) => {
  const [url, setUrl] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await onFetchMetadata(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  return (
    <div className="glass-panel url-card">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="input-group">
          <div className="input-wrapper">
            <input
              type="url"
              className="url-input"
              placeholder="Paste YouTube, Twitter, TikTok, or video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            <Link2 className="input-icon" size={20} />

            {url ? (
              <button
                type="button"
                className="action-btn-inside"
                onClick={handleClear}
                title="Clear input"
              >
                <X size={14} /> Clear
              </button>
            ) : (
              <button
                type="button"
                className="action-btn-inside"
                onClick={handlePaste}
                title="Paste from clipboard"
              >
                <Clipboard size={14} /> Paste
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Fetch Video Info</span>
              </>
            )}
          </button>
        </div>

        {url.trim() && !loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => onDirectEnqueue(url.trim())}
            >
              <span>Quick Enqueue (Default Format)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
