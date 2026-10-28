# Palimpsa

Shared live-editing notes app (Tiptap + Yjs + Hocuspocus, Fastify, Postgres), built mainly as a DevOps/DevSecOps portfolio project.
Full spec, milestones and decisions: `personal/palimpsa.md` (gitignored, local only). Read it at the start of a session.

## How to work with me (important)

- **I write all the code myself.** Do not write or edit code/config files in this repo unless I explicitly say so. And even then, show it in chat for me to type, while still letting me choose the names for variables, files, and other names. You just give me the pseudo implementation, I do the implementing. Don't write any files yourself at all or run any commands that cause writing files unless I explicitly give you permission.
- **Guide concretely, no Socratic questions.** Tell me exactly what to think about, in what order, and give me the facts I don't know:
  package names, exact APIs and their current versions, CLI commands, config keys, gotchas, how to verify each step.
- Point out version differences when docs/blogs online are outdated (e.g. Tiptap v2 vs v3, Hocuspocus v2 vs v3).
- When I'm done with a step, review what I wrote and say what's wrong or missing.
- Keep it short and practical.

## Git conventions

- Conventional Commits: `type(scope): imperative summary`, e.g. `feat(collab): add hocuspocus server`.
  Types: feat, fix, docs, refactor, test, build, ci, chore, perf. Scopes: web, api, collab, db, infra, monitoring, docs. However, don't give me the commits names (let me choose the names) unless I explicitly ask you for them.
- Branches: `type/short-description`, e.g. `feat/collab-server`, `ci/trivy-scan`. One branch per PR, squash merge, PR title is a conventional commit.

## Progress

Current milestone: 4 (real frontend). Update this line as milestones complete.
