# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app
# build tools only for build stage
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --silent
COPY . .
# Build client to dist/public and server to dist/
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine AS production
WORKDIR /app

# Ensure prod mode at runtime
ENV NODE_ENV=production

# Copy only what we need
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production deps only
RUN npm ci --omit=dev --silent

# Render/most hosts inject PORT; EXPOSE is informational
EXPOSE 5000

# Start server (must read process.env.PORT in your code)
CMD ["node", "dist/index.js"]
