# yt-dlp Web-Based Frontend (React + Vite + Bun)

A production-ready, ultra-responsive frontend web application for the `yt-dlp` Go backend service supporting **Flexible Client IP Forwarding Options**, **Per-IP Download History**, **Media File Serving**, and **Header Engine Controls**.

---

## 🌟 Key Features

- **Flexible Client IP Payload Options**:
  - **JSON Body**: Sends `ip` & `client_ip` keys in `POST /api/v1/jobs` request body (`{ url, format, client_ip: "...", ip: "..." }`).
  - **Query Parameters**: Appends `?client_ip=...&ip=...` to `POST /api/v1/jobs` and `GET /api/v1/my-downloads`.
  - **Path Parameters**: Supports `GET /api/v1/my-downloads/:ip` and `GET /api/v1/downloads/ip/:ip` for querying per-IP download history.
- **Client IP Auto-Detection & Manual Query**: Automatically detects client's public IP address with a manual IP search query field in the "IP History" tab.
- **Media File Download Serving (`GET /api/v1/jobs/:id/file`)**: Serves completed media downloads with `Content-Disposition` matching original source video titles (e.g. `Rick Astley - Never Gonna Give You Up.mp4`).
- **24-Hour File Cleanup Retention**: Seamlessly handles `cleaned` job status when 24h file retention background service cleans up expired media files on server disk.
- **Modern Glassmorphic UI with Light & Dark Modes**: Premium theme switcher with smooth transitions, contrast optimization, and `localStorage` persistence.
- **Dynamic `.env` Best Practices**: Supports `.env`, `.env.development` (default API backend `http://localhost:8081`), and `.env.production`.
- **Real-Time Progress Streaming (SSE)**: Live progress bar updates (0-100%) streamed via Server-Sent Events (`GET /api/v1/jobs/:id/progress`).

---

## 📡 Backend API Integration Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Check PostgreSQL, Redis & API status |
| `GET` | `/api/v1/yt-dlp/version` | Inspect current `yt-dlp` executable version |
| `POST` | `/api/v1/yt-dlp/update` | Trigger `yt-dlp -U` self-updater |
| `POST` | `/api/v1/metadata` | Extract video metadata (cached 24h) |
| `POST` | `/api/v1/jobs` | Enqueue job (accepts `ip`/`client_ip` in Body & Query Params) |
| `GET` | `/api/v1/jobs/:id/progress` | **SSE Stream** for real-time progress events |
| `GET` | `/api/v1/jobs/:id` | Check job status and output metadata |
| `GET` | `/api/v1/jobs/:id/file` | **File Download Endpoint** (Original Title) |
| `GET` | `/api/v1/my-downloads` | Query IP history via Query Params (`?client_ip=...`) or Path Params (`/:ip`) |
| `POST` | `/api/v1/jobs/:id/cancel` | Send cancellation signal to active job |
