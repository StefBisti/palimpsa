# api

Fastify service for Palimpsa: accounts, auth (JWT), notes and sharing.
Runs TypeScript directly on Node 26 (type stripping), no build step.

## Routes

All routes are under `/api`. Routes marked 🔒 need `Authorization: Bearer <accessToken>`.

| Method | Path                           | Description                                                           |
| ------ | ------------------------------ | --------------------------------------------------------------------- |
| GET    | `/health`                      | `{ ok: true }` if the db is reachable                                 |
| POST   | `/auth/register`               | create an account `{ email, password }` → `201 { id }` (rate limited) |
| POST   | `/auth/login`                  | → `{ accessToken }` + `refresh_token` httpOnly cookie (rate limited)  |
| POST   | `/auth/refresh`                | new access token from the refresh cookie                              |
| POST   | `/auth/logout`                 | clears the refresh cookie                                             |
| GET    | `/auth/me` 🔒                   | `{ id, email }`                                                       |
| GET    | `/notes` 🔒                     | notes you own or that are shared with you, with your role             |
| POST   | `/notes` 🔒                     | create a note `{ title }`                                             |
| GET    | `/notes/:id` 🔒                 | one note (any role)                                                   |
| PATCH  | `/notes/:id` 🔒                 | rename (owner, editor)                                                |
| DELETE | `/notes/:id` 🔒                 | delete (owner)                                                        |
| GET    | `/notes/:id/members` 🔒         | list members (any role)                                               |
| PUT    | `/notes/:id/members` 🔒         | share or change role `{ email, role: "editor" \| "viewer" }` (owner)  |
| DELETE | `/notes/:id/members/:userId` 🔒 | unshare (owner)                                                       |

Notes you can't access return `404`, so their existence isn't leaked. Notes you can see but not change return `403`.

## Tokens

- **Access token:** HS256 JWT, valid for 10 min. The client keeps it in memory. Collab verifies it with the same secret.
- **Refresh token:** HS256 JWT signed with a separate secret, valid for 7 days. It's an httpOnly, `SameSite=Strict` cookie, scoped to `/api/auth`.

## Environment

| Variable             | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `PORT`               | port to listen on                                     |
| `DATABASE_URL`       | Postgres connection string                            |
| `JWT_ACCESS_SECRET`  | at least 32 chars, shared with collab                 |
| `JWT_REFRESH_SECRET` | at least 32 chars, must differ from the access secret |
| `COOKIE_SECURE`      | `true` in prod (HTTPS), `false` locally               |

The app validates these at startup and refuses to start if any are missing or invalid.

## Development

From the repo root:

```bash
docker compose up --watch
```

The api runs on `http://localhost:3000` and restarts when you edit files in `src`.

## Tests

Integration tests run the app in-process against a throwaway Postgres:

```bash
npm run test:db       # start db-test and run migrations
npm test
npm run typecheck
npm run test:db:down
```

## Image

`ghcr.io/stefbisti/palimpsa-api:sha-<commit>`. It's based on `node:26-trixie-slim` (pinned by digest) and runs as non-root, with no npm in the image and a read-only root filesystem.
