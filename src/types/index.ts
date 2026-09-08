export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'cleaned';

export interface HealthResponse {
  postgres: string;
  redis: string;
  status: string;
}

export interface YtDlpVersionResponse {
  current_version: string;
}

export interface YtDlpUpdateResponse {
  status: string;
  message: string;
  previous_version?: string;
  current_version: string;
  updated: boolean;
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
  client_ip?: string;
  url: string;
  format: string;
  status: JobStatus;
  progress: number;
  title?: string;
  file_name?: string;
  extension?: string;
  file_size?: number;
  file_path?: string;
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

export interface MyDownloadsResponse {
  client_ip: string;
  total: number;
  jobs: Job[];
}

export interface SSEProgressData {
  job_id: string;
  status: JobStatus;
  progress: number;
  title?: string;
  file_name?: string;
  extension?: string;
  file_size?: number;
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
