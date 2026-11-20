# e2e

Playwright tests that run in a real browser against the full stack, through the proxy on `http://localhost`.

## What's covered

| Test | Checks |
| --- | --- |
| `auth.spec.ts` | sign up, session survives a reload (restored from the refresh cookie), log out |
| `notes.spec.ts` | title and content survive a reload, the note shows in the list, delete |
| `sharing.spec.ts` | an editor and the owner see each other's text and carets live; a viewer sees changes but can't edit |

Server-side rules (rejected tokens, viewer edits dropped by collab, and so on) are tested in each service. These tests only cover what a user sees.

## Test users

`auth.setup.ts` runs first. It registers an owner and a friend through the API and saves their login cookies in `.auth/` (gitignored). The other tests start already logged in as them.

This exists because register and login are rate limited to 5 requests per minute per IP. A full run uses 3 of each. If you run the suite twice within a minute, you get `Rate limit exceeded`. Wait a minute, or reset the counters with `docker compose restart api`.

## Running locally

From the repo root:

```bash
docker compose up --build -d --wait
cd e2e
npm ci
npx playwright install chromium
npm test
npx playwright test --ui    # watch and debug the tests
```

## CI

`e2e.yml` runs on every PR, with no paths filter, since a change to any service can break the full flow. It:

1. writes a `.env` with throwaway secrets
2. starts the stack from the prod images (`BUILD_TARGET=prod`)
3. runs the tests in Chromium, with 2 retries and traces on retry

On failure, the job prints the service logs, and the HTML report is attached to the run as `playwright-report`.
