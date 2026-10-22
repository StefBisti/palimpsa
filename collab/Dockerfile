FROM node:26-trixie-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
USER 1000:1000
CMD [ "node", "src/server.ts"]