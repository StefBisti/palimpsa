# db

Postgres schema for Palimpsa, as plain SQL migrations, plus the `migrate` image that applies them.

## Schema

| Table | Columns |
| --- | --- |
| `users` | `id`, `email` (unique), `password_hash`, `created_at` |
| `notes` | `id`, `title`, `ydoc` (the Yjs document, written by collab), `owner_id` → `users`, `updated_at` |
| `note_members` | `note_id` → `notes`, `user_id` → `users`, `role` (`editor` or `viewer`) |

Deleting a user deletes their notes and memberships, and deleting a note deletes its memberships (`ON DELETE CASCADE`).

## How migrations run

The `migrate` service is a one-off container: it runs `dbmate up` and exits. In compose, it waits for `db` to be healthy, and `api` and `collab` only start once it has finished successfully. dbmate records applied migrations in the `schema_migrations` table, so each one runs exactly once.

The migrations are baked into the image. After adding or changing one, rebuild it: `docker compose up --build`.

## Adding a migration

```bash
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD/db/migrations:/migrations" \
  ghcr.io/amacneil/dbmate:2 --migrations-dir /migrations new add_something
```

This creates `db/migrations/<timestamp>_add_something.sql`. Write both sections:

```sql
-- migrate:up
ALTER TABLE notes ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- migrate:down
ALTER TABLE notes DROP COLUMN archived;
```

Rules:

- **Never edit a migration that has been merged.** It may already have run somewhere, and dbmate won't run it again. Add a new one instead.
- **Always write `migrate:down`.** CI rolls every migration back and applies them again, so a broken down section fails the PR.

## Environment

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, with `?sslmode=disable` inside the compose network |

## CI

`db.yml` builds the image, applies all migrations to an empty Postgres, rolls every one of them back, and applies them again. Then it lints the Dockerfile, scans the image and publishes it.

## Image

`ghcr.io/stefbisti/palimpsa-migrate:sha-<commit>`. It's based on `ghcr.io/amacneil/dbmate` (Alpine, pinned by digest, packages upgraded) and runs as non-root with a read-only root filesystem.
