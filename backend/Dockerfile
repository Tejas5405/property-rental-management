# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

# ---------- production stage ----------
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && chown -R appuser:appgroup /app
COPY --from=build --chown=appuser:appgroup /app/dist/ dist/
USER appuser
EXPOSE 4000
CMD ["node", "dist/server.js"]
