# AGENTS.md — Arcen Digital Client Portal

Rules for any AI agent working in this repo. Read this before making changes.

## Stack

- Plain HTML/CSS/JS. No framework, no bundler, no build step, no `package.json`.
- Three files carry all app logic: `index.html` (structure), `styles.css` (all styling), `app.js` (all data + rendering + interactions). ES5-style global-scope functions; declarations are hoisted, so call-order in the file doesn't matter.
- Data model: a single `db` object (seeded from `DEFAULT` in `app.js`), persisted to `localStorage`. This is the source of truth for everything except the client list.
- Cloud: one Supabase table, `portal_clients`, used only to share the "Past Clients" list across the team (Juriann, Tiaan, Ruben). Everything else (invoice, agreement, milestones, activity, messages) is local-per-device by design — see README.md's "Cloud sync" section.
- PDF export via `html2pdf.js` (CDN script tag in `index.html`), not a package dependency.

## Coding standards

- Keep it simple. This is a solo/small-agency internal tool, not a multi-tenant SaaS — resist the pull toward frameworks, service layers, or backend rewrites unless explicitly asked for (see MEMORY.md for a case where a much larger ask was scoped down to match this reality).
- No new dependencies unless a few lines of vanilla JS genuinely can't do it.
- Reuse existing CSS classes and icon names (`ICONS` map in `app.js`) before adding new ones — grep first.
- Mobile-first responsive rules already exist in `styles.css` (see `@media(max-width:900px)` etc.) — follow the existing breakpoint pattern.
- Don't add a database, backend, or auth system beyond the existing single Supabase table unless explicitly requested.
- Don't deploy (Cloudflare Pages) without explicit instruction.

## Folder conventions

- `docs/superpowers/specs/` — brainstorming design docs (one per feature), `YYYY-MM-DD-<topic>-design.md`.
- `docs/superpowers/plans/` — implementation plans, `YYYY-MM-DD-<feature>.md`.
- `.superpowers/sdd/` — scratch workspace for subagent-driven-development runs (task briefs, reports, diffs, progress ledger). Git-ignored, safe to ignore/delete between plan runs.

## Commands

- No test runner exists. Verification is `node --check app.js` (syntax) plus manual browser testing (Live Server locally, or the Claude Preview MCP tool when available).
- Local dev: open `index.html` via VS Code's Live Server extension (see README.md), or `npx serve .` (see `.claude/launch.json`, server name `static`, port 5173).

## Deployment rules

- Deploy target is Cloudflare Pages (upload `index.html`, `app.js`, `styles.css` — keep `index.html` at top level). Never deploy without the user explicitly asking.

## Testing rules

- No automated test framework — do not introduce one speculatively (Jest, etc.) unless the user asks. `node --check` + manual/browser verification is the established pattern for this repo.

## Security rules

- The Supabase key in `app.js` (`SUPA_KEY`) is a publishable key, intentionally safe to ship client-side. Do not treat it as a secret, but also don't add a service-role key here.
- There is deliberately no sign-in/auth in this app (removed 2026-07-03 — see MEMORY.md) — it's an internal tool for Arcen Digital staff only, trusted equally. Do not re-add a login gate unless explicitly asked. Access control, if ever needed again, lives in Supabase RLS policies, not client-side auth UI.

## MCP usage

- Use the Claude Preview MCP tools (not Bash/chrome) for verifying UI changes in a browser — see `.claude/launch.json` for the static server config.
- Use the Supabase MCP only if working on the `portal_clients` table/schema directly; this project otherwise talks to Supabase via the `@supabase/supabase-js` CDN script in `index.html`, not server-side.

## Do-not-do list

- Do not silently replace this local-storage/single-table architecture with a full backend, ORM, or multi-table schema — that's a large decision requiring explicit user sign-off (see MEMORY.md).
- Do not add fake/placeholder/demo data anywhere — this project just went through a full audit specifically to remove that (see MEMORY.md).
