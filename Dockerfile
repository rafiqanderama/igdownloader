FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
  ca-certificates curl gnupg2 build-essential \
  ffmpeg python3 python3-venv quickjs \
  && rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

COPY package.json .
RUN apt-get update && apt-get install -y nodejs npm
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
