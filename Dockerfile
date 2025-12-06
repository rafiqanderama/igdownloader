FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
  curl ffmpeg python3 python3-pip && \
  pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
