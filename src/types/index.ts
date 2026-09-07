export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface HealthResponse {
  postgres: string;
  redis: string;
  status: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  thumbnail: string;
  url: string;
  description?: string;
}

export interface MetadataResponse {
  source: 'extracted' | 'cache' | string;
  metadata: VideoMetadata;
}

export interface Job {
  id: string;
  url: string;
  format: string;
  status: JobStatus;
  progress: number;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  speed?: string;
  eta?: string;
  error?: string;
  created_at?: string;
  metadata?: VideoMetadata;
}

export interface JobResponse {
  message?: string;
  job: Job;
}

export interface SSEProgressData {
  job_id: string;
  status: JobStatus;
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
  timestamp?: string;
}

export type FormatCategory = 'all' | 'video' | 'audio' | 'custom';

export interface DownloadFormatOption {
  id: string;
  label: string;
  description: string;
  category: 'video' | 'audio' | 'best';
  badge: 'Video' | 'Audio' | 'Best' | 'Lossless';
  icon: 'video' | 'audio' | 'sparkles' | 'film' | 'disc' | 'headphones';
}
