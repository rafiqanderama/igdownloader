# Gunakan Node 18 LTS (stabil & modern)
FROM node:18-slim

# Install dependensi sistem
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    python3 \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (binary official)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

# Set workdir
WORKDIR /app

# Copy package.json & package-lock.json (jika ada)
COPY package*.json ./

# Install node modules
RUN npm install --legacy-peer-deps

# Copy semua file project
COPY . .

# Expose port
EXPOSE 3000

# Run server
CMD ["node", "server.js"]
