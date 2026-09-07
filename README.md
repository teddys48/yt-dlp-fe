# yt-dlp Web-Based Frontend (React + Vite + Bun)

A production-ready, ultra-responsive frontend web application for the `yt-dlp` Go backend service. Built with **React 18**, **Vite**, **TypeScript**, **Bun**, and **Vanilla CSS Glassmorphism**.

---

## 🌟 Key Features

- **Modern Glassmorphic UI with Light & Dark Modes**: Premium theme switcher with smooth transitions, contrast optimization, and `localStorage` persistence.
- **Fixed & Clean UI**: Resolved input field button collision, ensuring placeholder and input text never overlap with the inside Paste/Clear button.
- **SEO Friendly & Optimized**: Includes OpenGraph tags, Twitter Cards, canonical links, and JSON-LD (`WebApplication` schema) structured data.
- **Dynamic `.env` Best Practices**: Supports `.env`, `.env.development` (default API backend `http://localhost:8081`), and `.env.production`.
- **Real-Time Progress Streaming (SSE)**: Live progress bar updates (0-100%), download speed (`3.2 MiB/s`), ETA countdown, and file status streamed via Server-Sent Events (`GET /api/v1/jobs/:id/progress`).
- **Video Metadata Extraction**: Instant video preview card displaying thumbnail, title, channel uploader, duration (HH:MM:SS), and cached/extracted status badges (`POST /api/v1/metadata`).
- **Multi-Format Selection**: Seamless options for downloading Best Quality (`best`), MP4 Video (`mp4`), Audio Only MP3 (`mp3`), or Video Only (`bestvideo`).
- **Live Health Status Indicator**: Monitoring for API Gateway (port `8081`), PostgreSQL database, and Redis cache (`GET /health`).
- **Bun & Dockerized**: Multi-stage `Dockerfile` using `oven/bun:alpine` and `nginx:alpine` configured for SPA fallback routing and unbuffered SSE proxying.

---

## ⚙️ Environment Variables Setup (.env)

The project includes pre-configured environment files:

| File | Purpose | Default `VITE_API_BASE_URL` |
| :--- | :--- | :--- |
| `.env` | Default fallback config | `http://localhost:8081` |
| `.env.development` | Local development config | `http://localhost:8081` |
| `.env.production` | Production build config | relative (proxy via Nginx) |
| `.env.example` | Example template for team devs | `http://localhost:8081` |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- `yt-dlp` Backend API running on port `8081` (`http://localhost:8081`)

### Local Development

1. Navigate to the project directory:
```bash
cd /home/teddy/code/yt-dlp-fe
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun run dev
```

Open your browser at `http://localhost:3000`.

### Production Build & Docker

```bash
# Build production bundle
bun run build

# Build and run Docker container
docker build -t yt-dlp-fe .
docker run -d -p 3000:80 --name yt-dlp-fe-container yt-dlp-fe
```

---

## 📡 Backend API Integration (Port 8081)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Check PostgreSQL, Redis & API status |
| `POST` | `/api/v1/metadata` | Extract video metadata (cached 24h) |
| `POST` | `/api/v1/jobs` | Enqueue a download task in Redis queue |
| `GET` | `/api/v1/jobs/:id/progress` | **SSE Stream** for real-time progress events |
| `GET` | `/api/v1/jobs/:id` | Check job status from PostgreSQL |
| `POST` | `/api/v1/jobs/:id/cancel` | Send cancellation signal to active job |
