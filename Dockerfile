FROM debian:stable-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies (tanpa python3-distutils)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg2 build-essential \
    ffmpeg quickjs apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
