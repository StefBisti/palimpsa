# syntax=docker/dockerfile:1
# check=error=true

FROM node:26-trixie-slim@sha256:e4db4c914bf8ad241bd24804fc25d272d89bad97e68cdc8a1414862790a02c39 AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM base AS dev
COPY --chown=node:node ./src ./src
USER node
CMD ["node", "--watch", "src/server.ts"]

FROM base AS prod
ENV NODE_ENV=production
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY ./src ./src
USER node
LABEL org.opencontainers.image.source="https://github.com/stefbisti/palimpsa"
CMD ["node", "src/server.ts"]