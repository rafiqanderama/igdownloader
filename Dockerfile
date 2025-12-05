FROM node:18

# Install Python, FFmpeg, dan yt-dlp
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install yt-dlp

# Set workdir
WORKDIR /app

# Copy project files
COPY package*.json ./
RUN npm install

COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
