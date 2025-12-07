FROM node:18-slim

# install dependencies
RUN apt-get update && apt-get install -y curl ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# set workdir
WORKDIR /app

# copy package.json & install deps
COPY package*.json ./
RUN npm install --production

# copy app files
COPY . .

# expose port
EXPOSE 3000

CMD ["node", "server.js"]
