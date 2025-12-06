# Dockerfile minimal, based on official Node to avoid python/pip system-managed issues
FROM node:18-bullseye-slim

# install ffmpeg (required for some yt-dlp features) and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# download standalone yt-dlp binary (executable)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

# app dir
WORKDIR /app

# copy package.json first for layer caching, then install
COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

# copy app
COPY . .

# expose port (match fly.toml)
EXPOSE 3000

# start
CMD ["node", "server.js"]
