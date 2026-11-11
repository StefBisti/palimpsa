# syntax=docker/dockerfile:1
# check=error=true

FROM node:26-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS base
WORKDIR /app
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* 
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM base AS dev
COPY --chown=1000:1000 ./src ./src
USER 1000
CMD ["node", "--watch", "src/server.ts"]

FROM base AS prod
ENV NODE_ENV=production
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY ./src ./src
USER 1000
LABEL org.opencontainers.image.source="https://github.com/stefbisti/palimpsa"
CMD ["node", "src/server.ts"]
