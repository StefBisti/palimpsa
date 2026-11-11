# collab

Hocuspocus websocket server for Palimpsa. Keeps each note's Yjs document in memory, syncs edits between everyone who has the note open, and saves the document to Postgres.
Runs TypeScript directly on Node 26 (type stripping), no build step.

## How it works

1. The client opens a websocket and joins a document named after the note's id.
2. It sends its access token, the same JWT the api issues.
3. collab checks the token and looks up the user's role on that note:
   - **owner or editor:** read-write connection
   - **viewer:** read-only connection. The server drops any edits it sends, so this doesn't rely on the UI.
   - **no access, invalid token or a document name that isn't a uuid:** the connection is refused.

## Persistence

- A document is loaded from `notes.ydoc` when the first client joins.
- It's saved 2s after the last change, and at least every 10s while people keep typing.
- On `SIGTERM` or `SIGINT`, the server closes all connections, saves every open document, closes the db pool and exits. Compose gives it `stop_grace_period: 30s` for this.

## Environment

| Variable | Description |
| --- | --- |
| `PORT` | port to listen on |
| `DATABASE_URL` | Postgres connection string |
| `JWT_ACCESS_SECRET` | at least 32 chars, the same value as the api's |

The app validates these at startup and refuses to start if any are missing or invalid.

## Development

From the repo root:

```bash
docker compose up --watch
```

collab runs on `ws://localhost:1234` and restarts when you edit files in `src`.

## Tests

Integration tests run the server in-process and connect real Hocuspocus clients to it, against a throwaway Postgres:

```bash
npm run test:db       # start db-test and run migrations
npm test
npm run typecheck
npm run lint
npm run test:db:down
```

## Image

`ghcr.io/stefbisti/palimpsa-collab:sha-<commit>`. It's based on `node:26-trixie-slim` (pinned by digest) and runs as non-root, with no npm in the image and a read-only root filesystem.
