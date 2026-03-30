# Copilot instructions for this project

## General rules
- Always make the smallest production-ready change possible.
- Do not use placeholders, fake logic, mocks, stubs, or TODO implementations unless explicitly requested.
- Preserve the existing architecture, naming conventions, and folder structure.
- Do not rewrite large files unless it is necessary for the requested task.
- Before editing, inspect related files, imports, exported types, call sites, and navigation flow.

## Code quality
- Prefer explicit TypeScript-safe changes.
- Keep code readable, consistent, and production-ready.
- Avoid introducing unnecessary dependencies.
- Fix root causes, not just symptoms.
- When changing a shared type, check all usages across the codebase.

## Editing behavior
- Update only the files required for the task.
- Keep styles and patterns consistent with nearby code.
- For bug fixes, inspect related screens, services, hooks, utilities, storage, and types before editing.
- For new features, identify all affected files first, then make coordinated updates.

## Safety
- Never delete files unless explicitly asked.
- Never run destructive terminal commands unless explicitly asked.
- Never run git reset, git clean, rm, sudo, chmod, or chown unless explicitly asked.
- Prefer safe validation commands after edits.

## Validation
- After making code changes, prefer running safe validation commands when relevant.
- Prefer commands like git status, npm run lint, npm run typecheck, npm test, expo start, or other non-destructive project checks.
- If a command could alter or remove data, require explicit user intent.

## Output style
- When summarizing changes, clearly list:
  1. what was changed
  2. why it was changed
  3. any follow-up issues or risks