FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
  nodejs npm curl ffmpeg python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (Linux)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# FIX 500 ERROR – buat folder /data
RUN mkdir -p /data && chmod -R 777 /data

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
