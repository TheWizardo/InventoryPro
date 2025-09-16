# ---------- Build stage ----------
FROM node:18-bullseye AS builder

WORKDIR /app

# Install build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Force a clean install and build of all dependencies, including native modules
RUN npm install lightningcss-linux-x64-gnu
RUN npm install @tailwindcss/oxide-linux-x64-gnu
RUN npm install

# Copy source code after the clean install
COPY . .

# Build Next.js app
RUN npm run build

# ---------- Runtime stage ----------
FROM node:18-bullseye AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy only the built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]