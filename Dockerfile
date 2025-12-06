FROM debian:stable-slim

# Install dependencies: Node.js, npm, curl, ffmpeg, python3
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    python3 \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18 (stable)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && apt-get install -y nodejs

# Install yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy remaining app files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
