FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
ARG APP_VERSION=local
LABEL org.opencontainers.image.source="https://github.com/ZG-Customs/ZG-Customs"
LABEL org.opencontainers.image.revision="$APP_VERSION"
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
