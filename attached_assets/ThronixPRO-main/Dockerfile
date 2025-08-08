# ---------- Base build stage ----------
FROM node:20-alpine AS builder

# Install build tools
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci --silent

# Copy full project into container
COPY . .

# Build the app (includes vite + esbuild)
RUN npm run build

# ---------- Production image ----------
FROM node:20-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy only built output and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/index.js"]