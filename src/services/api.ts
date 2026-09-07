import {
  HealthResponse,
  MetadataResponse,
  JobResponse,
  Job,
  SSEProgressData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Custom Error class with message and status code
 */
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with JSON error parsing
 */
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
        // Fallback to text status
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
   * Extract Video Metadata: POST /api/v1/metadata
   */
  async extractMetadata(url: string): Promise<MetadataResponse> {
    return request<MetadataResponse>('/api/v1/metadata', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  /**
   * Enqueue Download Job: POST /api/v1/jobs
   */
  async enqueueJob(url: string, format: string = 'best'): Promise<JobResponse> {
    return request<JobResponse>('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify({ url, format }),
    });
  },

  /**
   * Check Job Status: GET /api/v1/jobs/:id
   */
  async getJobStatus(id: string): Promise<{ job: Job }> {
    return request<{ job: Job }>(`/api/v1/jobs/${id}`);
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
   * Subscribe to Server-Sent Events (SSE) for job progress: GET /api/v1/jobs/:id/progress
   */
  subscribeJobProgress(
    id: string,
    onProgress: (data: SSEProgressData) => void,
    onError?: (err: Event) => void
  ): () => void {
    const sseUrl = `${API_BASE_URL}/api/v1/jobs/${id}/progress`;
    const eventSource = new EventSource(sseUrl);

    // Listen to standard 'progress' event emitted by backend SSE stream
    const handleProgress = (event: MessageEvent) => {
      try {
        const parsed: SSEProgressData = JSON.parse(event.data);
        onProgress(parsed);
      } catch (err) {
        console.error('Failed to parse SSE data:', err, event.data);
      }
    };

    // Generic message handler fallback if backend emits without custom event name
    const handleMessage = (event: MessageEvent) => {
      handleProgress(event);
    };

    eventSource.addEventListener('progress', handleProgress);
    eventSource.onmessage = handleMessage;

    eventSource.onerror = (err) => {
      console.warn(`SSE connection error for job ${id}`, err);
      if (onError) onError(err);
    };

    // Return cleanup function to close connection
    return () => {
      eventSource.removeEventListener('progress', handleProgress);
      eventSource.close();
    };
  },
};
