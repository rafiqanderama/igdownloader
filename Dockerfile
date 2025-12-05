FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
  curl ffmpeg python3 && \
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp && \
  chmod a+rx /usr/local/bin/yt-dlp && \
  mkdir -p /app

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
