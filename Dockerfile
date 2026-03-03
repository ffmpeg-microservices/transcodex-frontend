# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # outputs to /app/dist

# Stage 2 — serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Important: handle React Router — all routes fall back to index.html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80