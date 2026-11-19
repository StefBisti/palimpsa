# proxy

Caddy reverse proxy for Palimpsa, and the only service with published ports. Everything the browser talks to goes through it, on one origin.

## Routes

| Path | Goes to |
| --- | --- |
| `/api/*` | `api:3000` |
| `/collab*` | `collab:1234` (websocket, upgraded automatically) |
| `/healthz` | answered by Caddy itself, for the container healthcheck |
| everything else | `web:8080` |

Paths are passed through unchanged: the api's routes already start with `/api`, and collab ignores the path.

Responses are compressed with zstd or gzip, whichever the browser supports.

## Client IPs

Caddy sets `X-Forwarded-For` to the real client address and drops any value the client sent, so it can't be spoofed. The api trusts the header only from private-network addresses (`trustProxy: "uniquelocal"`), which is where Caddy sits. Rate limits are therefore applied to the real client.

## Development

From the repo root:

```bash
docker compose up --build -d --wait
```

The whole app is on `http://localhost`, served from the prod images. For frontend work with hot reload, use `npm run dev` in `web/` instead.

## Not yet

- **HTTPS:** `auto_https off` serves plain HTTP for now. With a domain (milestone 6), Caddy gets and renews certificates itself and stores them in the `caddy_data` volume.
- **Security headers** (HSTS, CSP and others) come in the hardening milestone.
- **Prod ports:** `compose.prod.yaml` publishes none yet, so a prod deploy isn't reachable until milestone 6 adds them.

## Image

`ghcr.io/stefbisti/palimpsa-proxy:sha-<commit>`. It's based on `caddy:2-alpine` (pinned by digest, packages upgraded) and runs as non-root on port 8080, with all capabilities dropped and a read-only root filesystem. The binary's file capability for low ports is removed, because a binary with a capability outside the allowed set can't start once all capabilities are dropped. The admin API is off.
