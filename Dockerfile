FROM debian:stable-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl ffmpeg python3 python3-pip && \
    pip3 install yt-dlp && \
    mkdir -p /app

# Install yt-dlp to /usr/local/bin explicitly
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
