# syntax=docker/dockerfile:1
# check=error=true

FROM node:26.5.0-trixie-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

# dev image
FROM base AS dev
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY --chown=node:node ./src ./src
USER node
CMD ["node", "--watch", "src/server.ts"]

# build step
FROM base AS build
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# prod image
FROM base AS prod
ENV NODE_ENV=production
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
LABEL org.opencontainers.image.source="https://github.com/stefbisti/palimpsa"
CMD ["node", "--enable-source-maps", "dist/server.js"]