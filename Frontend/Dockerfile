# ---------- Build stage ----------
FROM node:18-bullseye AS builder

WORKDIR /app

# Copy all files from the project directory
COPY . .

# Install dependencies and build the app
RUN npm install && npm run build

# ---------- Runtime stage ----------
FROM node:18-bullseye AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BACKEND_IP=192.168.200.89
ENV NEXT_PUBLIC_BACKEND_PORT=6001

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y libstdc++6 zlib1g --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy built app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]