FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
  curl ffmpeg python3 python3-pip && \
  pip3 install yt-dlp && \
  mkdir -p /app

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
