# Stage 1: Build React + Vite app with Bun
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lockb* ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile || bun install

# Copy source files
COPY . .

# Build production bundle
RUN bun run build

# Stage 2: Serve static assets with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA dist files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

