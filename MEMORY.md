# MEMORY.md — Arcen Digital Client Portal

Durable decisions and business context. Update when a meaningful project decision is made; don't log routine work here (git history covers that).

## Who / what this is

Solo/small-agency (Arcen Digital — Juriann, plus Tiaan and Ruben on the team) client-onboarding portal. One client "loaded" into the portal at a time; "Past Clients" is the historical list. Not a multi-tenant product — every user of this app IS Arcen Digital staff, not an external client logging into their own account.

## Architecture decision: local-first, not a backend rewrite (2026-07-03)

A request came in to "audit and remove all mock/placeholder data, add real-time subscriptions, centralize data into services, add optimistic UI" — i.e., rebuild this as a full production SaaS backend. Scoped down deliberately, confirmed with the user: keep the existing `localStorage` + single-Supabase-table architecture, and instead fix the *specific* fabricated values (fake "Upcoming meeting" card, fake "Project health" %, fake auto-reply in Messages, static hardcoded notification dropdown, empty-forever activity feed) so every displayed number derives from real local state. No new tables, no realtime, no service layer. Full design in `docs/superpowers/specs/2026-07-02-dashboard-real-data-design.md` and plan in `docs/superpowers/plans/2026-07-02-dashboard-real-data.md`.

Key consequence worth remembering: the Messages feature has no real inbound channel (no backend, no client-facing chat receiver) — after removing the fake auto-reply, `me:false` (incoming) messages can never be created again. The Dashboard's "Unread messages" stat and the nav badge were therefore replaced with a real "Messages sent" count rather than built around a `read`-flag mechanism that would have been permanently dead code.

## Known issues / gaps (as of 2026-07-03)

- Messages page has no real inbound channel — it's an outbound-only log of what you sent, not a live two-way chat. If a real chat backend is ever added, revisit the "Messages sent" stat and consider real unread tracking then.
- Agreement "signing" is a self-reported client-side toggle (`markSigned()`), not real e-signature capture (no signature image/legal audit trail). Sufficient for this tool's purpose (personal record-keeping); flag to the user if legal enforceability ever becomes a requirement.
- `.claude/settings.local.json` may accumulate tool-permission grants during subagent-driven-development runs as harmless diff noise (flagged by a task reviewer during the 2026-07-03 work) — not a functional issue, just noise to be aware of when reviewing diffs.

## Design preferences observed

- Prefers small, targeted fixes over speculative rewrites — explicitly chose "targeted fix" over "full production rebuild" when offered the choice.
- Comfortable approving concise design/plan docs quickly ("sure", "yes") once the scope is right-sized — the friction point is scope-setting up front, not reviewing the artifact afterward.
- Wants dead code deleted outright, not left commented out or "for later" (e.g. explicitly chose to delete unreachable pages like the old Timeline/Assets/Progress views rather than keep them dormant).
