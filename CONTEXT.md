# CONTEXT.md — current working context

Living doc for in-progress work. Update as state changes; safe to overwrite each session (git history + MEMORY.md hold the durable record).

## Current task

No active task — the most recent thread was a sequence of design-system passes, followed by many feature additions (Client Profile, Projects/Invoices visual passes, quick actions, global search, motion/polish, empty states, a full responsive audit, a "premium SaaS + accessibility" pass) — see MEMORY.md for the full history. After that, a real production bug was reported and fixed (the mobile-drawer backdrop was breaking the entire desktop layout — see MEMORY.md's "Bug fixed" entry), and the standalone global Messages page was removed at the user's request (kept: the Client Profile's separate per-client "Recent communication" card). All committed and pushed to `master` (`origin/master` on GitHub, `jurianndw/Juriann`), which auto-deploys to Cloudflare Pages.

Note for future sync-completion refreshes: use `safeRefresh()`, not `render()` directly — it skips refreshing while the user has an input/textarea focused, since several forms (Onboarding, Settings, Profile's composers) don't mirror to `db` until an explicit save/add.

Small known bug noticed but not fixed (unrelated to the Invoices work): `onboardStep` doesn't reset to 1 after finishing a client, so starting a second onboarding in the same session can land on the wrong step. See MEMORY.md's "Known issues" section.

Known limitation worth remembering: the Client Profile's rich fields (photo/notes/tasks/files/timeline/document snapshots) are local-only — they don't sync across the team via the shared Supabase table, only the original lightweight summary fields do. If the user wants team-wide sharing of notes/tasks/etc., that needs an actual Supabase schema change, not just app code.

## What's already done (design-system state)

See MEMORY.md's "Current visual design system" section for the durable summary — token conventions, what's deliberately excluded (print pages), and the FAB/ghost-button/forms decisions. Don't re-derive these from scratch; read that section first.

Chronologically, the design passes were: dashboard content prioritization → new app shell (collapsible sidebar, wider content, one floating save bar) → sidebar visual redesign → card redesign (radius/shadow/hover) → typography (large page titles, minimal weights) → color palette (light theme now default, semantic colors softened, three latent dark-only-hardcoded-color bugs found and fixed: topbar, toast, plus a stale blue selection color and missing light-theme scrollbar) → buttons (primary/secondary/ghost/icon all real classes, consistent hover-lift + press-scale language, `.btn.gold` dead class removed) → tables (Past Clients rebuilt as sortable/filterable/paginated/bulk-actionable) → forms (floating labels, larger fields, inline validation, Client Onboarding converted to a 3-step wizard, Settings kept single-page).

## Outstanding item (not yet done)

**Supabase RLS policy still needs a fix on the user's end** — writes to `portal_clients` fail for the `anon` role (confirmed via live test: `42501` RLS violation). Reads already work. Until the user applies the policy documented in MEMORY.md, new/edited clients save locally only and never reach the shared team list. This is on the user to do in the Supabase dashboard, not something we can fix from the client side.

## Next steps

None pending — no open request right now. If the user continues the design-polish sequence (a natural next candidate would be forms/inputs, or the printable Invoice/Agreement documents if they ever want those touched), follow the same pattern each prior pass used: audit current state first, use CSS custom properties not raw hex, verify contrast numerically before picking colors, verify in-browser via computed styles (screenshots have been unreliable this session — a paint-clock stall in the preview tab, not a real bug), commit with a detailed message, push.

## Relevant files

- `app.js` — all logic and HTML-string page templates.
- `index.html` — static shell (sidebar/topbar markup, font links).
- `styles.css` — all styling; `:root` (dark theme values) and `[data-theme="light"]` (light theme, now default) hold every color/shadow/surface token.

## Blockers

None on the coding side. The Supabase RLS policy above is the only outstanding real-world action item, and it's the user's to apply.
