# web

React frontend for Palimpsa: log in, list your notes, edit them live with others, and share them.
Built with Vite, React 19, React Router 8, shadcn/ui (Base UI) and Tiptap 3.

## What's in it

| Route | Page |
| --- | --- |
| `/login`, `/register` | sign in or create an account |
| `/` | your notes and notes shared with you, with your role on each |
| `/notes/:id` | the editor: title, toolbar, live carets with names, share dialog (owner only) |

- **Auth:** the access token lives only in memory. The refresh token is an httpOnly cookie, so a page reload restores the session through `/api/auth/refresh`. On a 401 the app refreshes once and retries.
- **Collab:** each open note is one websocket to `/collab`, with the note id as the document name. The provider asks for a fresh access token on every (re)connect. Viewers get a read-only editor, and the server drops their edits regardless.
- **Same origin:** the app always calls `/api` and `/collab` on its own host. In dev, Vite proxies them. In prod, the Caddy proxy routes them.

## Development

Start the backend from the repo root, then the Vite dev server:

```bash
docker compose up --watch --build   # db, migrate, api, collab
cd web && npm run dev               # http://localhost:5173
```

Vite proxies `/api` to `localhost:3000` and `/collab` to `localhost:1234`. Use a private window for a second user, because normal windows share the refresh cookie.

## Checks

```bash
npm run typecheck
npm run lint        # oxlint, type-aware, with the React plugin
npm run build
```

The app has no unit tests. Its behavior is covered by the end-to-end tests on the full stack.

## Image

`ghcr.io/stefbisti/palimpsa-web:sha-<commit>`. The app is built once on the build platform, then served as static files by `nginxinc/nginx-unprivileged` (Alpine, pinned by digest, packages upgraded). It runs as non-root on port 8080 with a read-only root filesystem, with no Node or npm in the image. `index.html` is never cached, and hashed assets are cached for a year.
