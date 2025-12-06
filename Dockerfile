# Base image Node.js
FROM node:18-slim

# Install ffmpeg and yt-dlp
RUN apt-get update && apt-get install -y ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy project files
COPY package*.json ./
RUN npm install

COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
