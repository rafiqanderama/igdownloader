FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y curl ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary (NO PYTHON NEEDED)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
