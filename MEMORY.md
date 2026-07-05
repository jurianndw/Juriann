# MEMORY.md — Arcen Digital Client Portal

Durable decisions and business context. Update when a meaningful project decision is made; don't log routine work here (git history covers that).

## Who / what this is

Solo/small-agency (Arcen Digital — Juriann, plus Tiaan and Ruben on the team) client-onboarding portal. One client "loaded" into the portal at a time; "Past Clients" is the historical list. Not a multi-tenant product — every user of this app IS Arcen Digital staff, not an external client logging into their own account.

## Architecture decision: local-first, not a backend rewrite (2026-07-03)

A request came in to "audit and remove all mock/placeholder data, add real-time subscriptions, centralize data into services, add optimistic UI" — i.e., rebuild this as a full production SaaS backend. Scoped down deliberately, confirmed with the user: keep the existing `localStorage` + single-Supabase-table architecture, and instead fix the *specific* fabricated values (fake "Upcoming meeting" card, fake "Project health" %, fake auto-reply in Messages, static hardcoded notification dropdown, empty-forever activity feed) so every displayed number derives from real local state. No new tables, no realtime, no service layer. Full design in `docs/superpowers/specs/2026-07-02-dashboard-real-data-design.md` and plan in `docs/superpowers/plans/2026-07-02-dashboard-real-data.md`.

Key consequence worth remembering: the Messages feature has no real inbound channel (no backend, no client-facing chat receiver) — after removing the fake auto-reply, `me:false` (incoming) messages can never be created again. The Dashboard's "Unread messages" stat and the nav badge were therefore replaced with a real "Messages sent" count rather than built around a `read`-flag mechanism that would have been permanently dead code.

## Reversal: notification bell removed (2026-07-03, later same day)

The notification bell/dropdown built as part of the above work (real-rendered from `db.activity`, unread dot, mark-as-read-on-open) was removed entirely at the user's request ("will not be needed") shortly after being shipped. Removed: `notifRow`/`renderNotif`/`toggleNotif`/`closeNotif`, the bell button and `#notif` container in `index.html`, and the `unread` field on activity entries. Kept: `logActivity()` and `db.activity` itself — the Dashboard's "Recent activity" card still needs them and was not part of this ask. If notifications are wanted again later, re-derive from `db.activity` rather than re-adding a separate tracking mechanism.

## Architecture decision: team sign-in removed (2026-07-03)

The Supabase team-login gate (login overlay, sign in/out, session-gated sync) was removed at the user's request — reasoning: "this is only for my agency and where we manage our client," i.e. not worth the friction for an internal tool used by a handful of trusted people. Confirmed with the user first, since removing login isn't just a UI change: it changes how the *shared* `portal_clients` table is protected. Chosen approach: keep the shared cloud sync (Past Clients still syncs across the team automatically), just drop the login prompt — `cloudReady()` no longer checks for a session, `initCloud()` calls `syncClients(true)` immediately instead of waiting for `onAuthStateChange`. Removed entirely: `session` var, `showLogin`/`hideLogin`/`skipLogin`/`doLogin`/`doLogout`, the `signedout` cloud-state, and the `.login-*` CSS block.

**⚠️ Action required on the Supabase side, not yet done:** reads already succeed anonymously (an existing policy must allow `anon` SELECT), but writes do not — confirmed via a live test: inserting a new client returns `42501 new row violates row-level security policy for table "portal_clients"` over the anon key. Until the RLS policy is updated, every new/edited client silently falls back to local-only (`_dirty:true`, chip shows "Offline — saved locally") and never reaches the shared table. Fix: in the Supabase dashboard → this project → Authentication/Policies → `portal_clients`, add a policy granting the `anon` role `INSERT`, `UPDATE`, and `DELETE` (SELECT already works), e.g.:
```sql
create policy "anon full access" on portal_clients
  for all to anon using (true) with check (true);
```
The old per-user Auth accounts (Juriann/Tiaan/Ruben) created for sign-in are no longer used by the app and can be left alone or removed at the user's discretion — they're not a functional dependency anymore.

## Known issues / gaps (as of 2026-07-03)

- Messages page has no real inbound channel — it's an outbound-only log of what you sent, not a live two-way chat. If a real chat backend is ever added, revisit the "Messages sent" stat and consider real unread tracking then.
- Agreement "signing" is a self-reported client-side toggle (`markSigned()`), not real e-signature capture (no signature image/legal audit trail). Sufficient for this tool's purpose (personal record-keeping); flag to the user if legal enforceability ever becomes a requirement.
- `.claude/settings.local.json` may accumulate tool-permission grants during subagent-driven-development runs as harmless diff noise (flagged by a task reviewer during the 2026-07-03 work) — not a functional issue, just noise to be aware of when reviewing diffs.
- `restore()`'s migration (`app.js`, fills missing keys from `DEFAULT`) only backfills missing *top-level* keys on `db`, not nested fields on objects that already exist. When `db.agreement.signed`/`signedDate` were added (2026-07-03), pre-existing localStorage saves keep `db.agreement` as-is and never get those two fields filled in — they simply read as `undefined` forever unless `markSigned()` is clicked. Harmless today because every reader treats `undefined` as falsy/empty, but the next person adding a nested field to an existing `DEFAULT` object should either follow the same undefined-tolerant-read pattern or extend the migration to be recursive.

## Design preferences observed

- Prefers small, targeted fixes over speculative rewrites — explicitly chose "targeted fix" over "full production rebuild" when offered the choice.
- Comfortable approving concise design/plan docs quickly ("sure", "yes") once the scope is right-sized — the friction point is scope-setting up front, not reviewing the artifact afterward.
- Wants dead code deleted outright, not left commented out or "for later" (e.g. explicitly chose to delete unreachable pages like the old Timeline/Assets/Progress views rather than keep them dormant).

## Current visual design system (as of 2026-07-05)

A long sequence of design passes (dashboard → sidebar → cards → typography → color palette → buttons) settled on a consistent identity, all driven by CSS custom properties in `styles.css` `:root` / `[data-theme="light"]` — never raw hex in component rules. Key established conventions a future session should follow, not re-litigate:

- **Light is the default theme** (`DEFAULT.theme` in `app.js`), not dark — soft off-white bg (`#FAF8F4`), near-black text, muted warm-gray secondary text, restrained/soft semantic colors (sage green / terracotta orange / dusty red, not vivid iOS colors). Dark mode still exists as a fully-supported secondary toggle with its own tuned values for every token — when adding a new color, define both a `:root` (dark) and `[data-theme="light"]` value, and verify contrast against *both* backgrounds (a few rounds of this needed real fixes — see the WCAG-checked hex values already in place before inventing new ones).
- **Warm brass/gold accent, used sparingly** (`--acc`/`--acc-2`/`--grad`/`--on-acc`) — reserved for progress indicators, active nav/state, and primary-button outlines, never a dominant fill. Solid-fill-with-white-text on this accent has failed contrast checks more than once; the established pattern is ink-base + gold border/text, filling solid only on hover/press with a dark (`--on-acc`) foreground.
- **Cards**: large radius (`--r-lg`, 26px), minimal (`--hair`-level) borders, soft rest-state shadow that grows on hover with a small lift (`--sh-card`/`--sh-card-hover`), `prefers-reduced-motion` always respected.
- **Buttons**: primary/secondary/ghost/icon are all real, distinct classes (`.btn.pri`, `.btn`, `.btn.ghost`, `.iconbtn`) with a shared hover-lift + press-scale interaction language. Floating action buttons are deliberately *not* scattered in — there is exactly one (Settings' sticky save bar, `.floatbar`), added because the long form genuinely needed it; a generic floating "+" was considered and rejected since the sidebar already covers navigation. Don't add another FAB without a similarly concrete reason.
- **Printable documents** (`.sheet`-scoped rules for the Invoice/Agreement pages) are deliberately excluded from every app-chrome redesign pass so far — bold labels, fixed document width, black-on-white are intentional print conventions, not something to "fix" to match the app's UI language.
- Typography: `.h1` (page titles) is large (`clamp(32px,4vw,44px)`) and a restrained numeric weight (560), consistent across every page except the Dashboard's own serif hero treatment (`--serif`, Fraunces) which is deliberately kept as the *only* serif/display moment in the app — don't spread it to other headings.
