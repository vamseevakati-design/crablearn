# Multi-stage production image for Crab Learn (Vite frontend + Express API)

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js Sample.css ./
COPY src ./src
ENV VITE_API_BASE_URL=
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["node", "server/index.js"]
