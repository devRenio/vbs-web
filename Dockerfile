# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# LOCAL DEVELOPMENT image (Vite dev server + HMR).
# For production the app is built to static files and served by
# GitHub Pages, so this Dockerfile intentionally targets DX only.
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine

# Vite's default dev port.
ENV PORT=5173

WORKDIR /app

# Install dependencies first for better layer caching.
# (Source is bind-mounted at runtime via docker-compose, so we only need
#  the manifests here to install into the image's node_modules.)
COPY package*.json ./
RUN npm install

# Copy the rest of the source (used when running the image standalone,
# without a bind mount).
COPY . .

EXPOSE 5173

# --host makes the dev server listen on 0.0.0.0 so it's reachable from the host.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
