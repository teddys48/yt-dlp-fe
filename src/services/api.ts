import {
  HealthResponse,
  MetadataResponse,
  JobResponse,
  Job,
  SSEProgressData,
  YtDlpVersionResponse,
  YtDlpUpdateResponse,
  MyDownloadsResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        // Fallback
      }
      throw new ApiError(response.status, errorMessage);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new Error(err instanceof Error ? err.message : 'Network error occurred');
  }
}

export const api = {
  /**
   * Health Check: GET /health
   */
  async checkHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health');
  },

  /**
   * Auto-detect Public IP Address via external IP API
   */
  async fetchPublicIp(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.ip) return data.ip;
      }
    } catch {
      // Ignore fallback
    }
    return '';
  },

  /**
   * Check yt-dlp Version: GET /api/v1/yt-dlp/version
   */
  async getYtDlpVersion(): Promise<YtDlpVersionResponse> {
    return request<YtDlpVersionResponse>('/api/v1/yt-dlp/version');
  },

  /**
   * Update yt-dlp Executable: POST /api/v1/yt-dlp/update
   */
  async updateYtDlp(): Promise<YtDlpUpdateResponse> {
    return request<YtDlpUpdateResponse>('/api/v1/yt-dlp/update', {
      method: 'POST',
    });
  },

  /**
   * Extract Video Metadata: POST /api/v1/metadata
   */
  async extractMetadata(url: string): Promise<MetadataResponse> {
    return request<MetadataResponse>('/api/v1/metadata', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  /**
   * Enqueue Media Download Job: POST /api/v1/jobs
   * Supports IP in JSON Body ({ url, format, client_ip, ip }) and Query Param (?client_ip=...&ip=...)
   */
  async enqueueJob(
    url: string,
    format: string = 'best',
    clientIp?: string
  ): Promise<JobResponse> {
    const query = clientIp
      ? `?client_ip=${encodeURIComponent(clientIp)}&ip=${encodeURIComponent(clientIp)}`
      : '';
    const body: Record<string, any> = { url, format };
    if (clientIp) {
      body.client_ip = clientIp;
      body.ip = clientIp;
    }

    return request<JobResponse>(`/api/v1/jobs${query}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Check Job Status: GET /api/v1/jobs/:id
   */
  async getJobStatus(id: string): Promise<{ job: Job }> {
    return request<{ job: Job }>(`/api/v1/jobs/${id}`);
  },

  /**
   * Get File Download URL endpoint: GET /api/v1/jobs/:id/file
   */
  getFileUrl(id: string): string {
    return `${API_BASE_URL}/api/v1/jobs/${id}/file`;
  },

  /**
   * List Downloads per IP: GET /api/v1/my-downloads
   * Supports Path Parameter GET /api/v1/my-downloads/:ip and Query Params ?client_ip=... or ?ip=...
   */
  async getMyDownloads(clientIp?: string): Promise<MyDownloadsResponse> {
    if (clientIp && clientIp.trim()) {
      const cleanIp = clientIp.trim();
      try {
        // Try Query Parameter GET /api/v1/my-downloads?client_ip=...&ip=...
        return await request<MyDownloadsResponse>(
          `/api/v1/my-downloads?client_ip=${encodeURIComponent(cleanIp)}&ip=${encodeURIComponent(cleanIp)}`
        );
      } catch {
        // Fallback to Path Parameter GET /api/v1/my-downloads/:ip
        try {
          return await request<MyDownloadsResponse>(
            `/api/v1/my-downloads/${encodeURIComponent(cleanIp)}`
          );
        } catch {
          // Fallback to path GET /api/v1/downloads/ip/:ip
          return await request<MyDownloadsResponse>(
            `/api/v1/downloads/ip/${encodeURIComponent(cleanIp)}`
          );
        }
      }
    }
    return request<MyDownloadsResponse>('/api/v1/my-downloads');
  },

  /**
   * Cancel Job: POST /api/v1/jobs/:id/cancel
   */
  async cancelJob(id: string): Promise<{ message: string; job_id: string }> {
    return request<{ message: string; job_id: string }>(`/api/v1/jobs/${id}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Subscribe to SSE Stream for job progress: GET /api/v1/jobs/:id/progress
   */
  subscribeJobProgress(
    id: string,
    onProgress: (data: SSEProgressData) => void,
    onError?: (err: Event) => void
  ): () => void {
    const sseUrl = `${API_BASE_URL}/api/v1/jobs/${id}/progress`;
    const eventSource = new EventSource(sseUrl);

    const handleProgress = (event: MessageEvent) => {
      try {
        const parsed: SSEProgressData = JSON.parse(event.data);
        onProgress(parsed);
      } catch (err) {
        console.error('Failed to parse SSE data:', err, event.data);
      }
    };

    eventSource.addEventListener('progress', handleProgress);
    eventSource.onmessage = handleProgress;

    eventSource.onerror = (err) => {
      console.warn(`SSE connection error for job ${id}`, err);
      if (onError) onError(err);
    };

    return () => {
      eventSource.removeEventListener('progress', handleProgress);
      eventSource.close();
    };
  },
};
