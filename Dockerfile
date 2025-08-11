# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Toolchain for node-gyp & friends
RUN apk add --no-cache python3 make g++

# Copy only manifests first for better cache
COPY package.json package-lock.json ./

# Install deps with logs visible; relax peer deps if needed
# (remove --legacy-peer-deps if your lockfile is clean)
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# Bring in the rest of the source
COPY . .

# (Optional) Generate clients that some libs expect at build time
# RUN npx prisma generate

# Build client+server to dist/
RUN npm run build

# Strip devDependencies but keep compiled binaries
RUN npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy pruned, compiled node_modules and built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

# Whatever your server binds to, ensure it uses process.env.PORT and 0.0.0.0
EXPOSE 5000
CMD ["node", "dist/index.js"]
