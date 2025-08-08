# Multi-stage Dockerfile for Render
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build client (Vite) and server (esbuild)
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S node -u 1001
# Copy only what we need
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node","dist/index.js"]
