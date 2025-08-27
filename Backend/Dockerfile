# Use a slim Node image
FROM node:18-alpine

WORKDIR /app

# Copy only package files first to leverage Docker layer caching
COPY package*.json ./

# Install production deps only
RUN npm i --omit=dev

# Copy compiled JS
COPY dist/ ./dist

# Expose backend port
EXPOSE 6001

# Start server (entry confirmed as dist/app.js)
CMD ["node", "dist/app.js"]