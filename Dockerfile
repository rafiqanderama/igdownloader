# Dockerfile — minimal & reliable for yt-dlp + Node
FROM debian:stable-slim

# set noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# install base tools, ffmpeg, quickjs, python3, ca-certificates, gnupg, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg2 ca-certificates build-essential \
    ffmpeg quickjs python3 python3-venv python3-distutils \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# install Node.js 18.x from NodeSource (stable)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# install yt-dlp binary (safe method: curl binary)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

# copy only package files first (leverages Docker cache)
COPY package*.json ./

# install node deps
RUN npm ci --only=production

# copy rest of app
COPY . .

# create folder to serve static if not exist
RUN mkdir -p /app/public

EXPOSE 3000

CMD ["node", "server.js"]
