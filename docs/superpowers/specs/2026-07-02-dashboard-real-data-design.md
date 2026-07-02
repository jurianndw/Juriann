# Dashboard real-data audit — design

## Problem

Several dashboard/UI elements show fabricated or static data instead of deriving from the app's actual state (the `db` object, persisted to `localStorage` and, for the client list only, synced to Supabase):

- Dashboard "Upcoming meeting" card — hardcoded date/time/platform, no real data source.
- Dashboard "Project health" card — Budget/Engagement percentages are made up, no underlying metric.
- Dashboard "Outstanding tasks" stat — hardcoded to `"1"`, no "tasks" entity exists in the data model.
- Messages page — fakes an auto-reply ("Thanks — got it...") 1.4s after every sent message.
- Notification bell — dropdown content is static HTML in `index.html` (hardcoded "3 new" + three fake entries), never updates.
- `db.activity` (Dashboard "Recent activity" card) exists and is correctly rendered, but nothing in the codebase ever writes to it — it is permanently empty.
- Nav "Messages" badge and Dashboard "Unread messages" stat are hardcoded to `"1"` regardless of actual message state.

## Decision: scope

Targeted fix, not a rebuild. Keep the current architecture: `localStorage`-backed `db` object, single shared Supabase table (`portal_clients`) for the client list only. No new Supabase tables, no realtime subscriptions, no cross-device sync of activity/notifications, no service-layer abstraction, no framework introduction. Everything below stays local-per-device, consistent with how invoices/milestones/messages already behave today.

No loading/optimistic-UI work is in scope: all data operations touched here are synchronous `localStorage` writes, not network calls. The one real network operation in the app (Supabase client-list sync) already has its own status chip and states and is untouched by this pass.

## Removals

- Dashboard "Upcoming meeting" card — deleted, no replacement (no real "meetings" concept exists).
- Dashboard "Project health" card (Budget/Engagement %) — deleted, no replacement (no honest way to compute these from current data).
- Dashboard "Outstanding tasks" stat card — deleted (the "Current stage" stat already shows the real next milestone; this one had nothing real to count).
- Messages fake auto-reply (`setTimeout` canned reply in `sendMsg()`) — deleted. Only messages the user actually sends are shown.

## New: real activity log

Add `logActivity(icon, text)` in `app.js`: pushes `{icon, text, when: <formatted timestamp>, unread:true}` to the front of `db.activity`, caps the array at 30 entries, persists. Single choke point — every real event in the app calls this, nothing pushes to `db.activity` directly.

Call sites:
| Event | Where | Icon/text |
|---|---|---|
| New client added | `onboardSave()`, only when `upsertClient`'s company-match lookup is a miss (new, not update) | "New client added: {company}" |
| Invoice created | `onboardSave()`, every save (invoice line items are rebuilt each time) | "Invoice {number} created for {company}" |
| Payment received | `saveSettings()`, when `inv.status` transitions from non-PAID to `"PAID"` | "Payment received — invoice {number}" |
| Project status changed | `saveSettings()`, when `p.status` old value !== new value | "Project status changed to {status}" |
| Milestone completed | new milestone checkbox `onchange` handler (see below) | "Milestone complete: {name}" |
| Agreement signed | new "Mark as signed" button (see below) | "Agreement signed by {client name}" |

## New: minimal UI for two missing trigger points

- **Milestones**: currently there is no UI anywhere to toggle `milestone.done` — it is permanently `false` from `DEFAULT`. Add a compact checklist (icon + name + checkbox) in the space freed by removing "Project health" on the Dashboard. Checking a box sets `done=true`, persists, calls `logActivity`, re-renders.
- **Agreement signing**: no "signed" concept exists on `db.agreement`. Add a `signed` (bool) and `signedDate` field, default `false`/`""`. Add a "Mark as signed" button on the Agreement page; once clicked it becomes a disabled "Signed on {date}" indicator, persists, calls `logActivity`.

## New: real notification bell

Replace the static `<div class="notif" id="notif">` markup in `index.html` (hardcoded header + 3 fake `.ni` rows) with an empty container that `app.js` renders from `db.activity`:
- Header shows real unread count (e.g. "2 new"), not a hardcoded "3 new".
- Each row renders from the same `{icon, text, when}` shape already used by the Dashboard's `actRow()` — reuse that renderer.
- Empty state: "No notifications yet" when `db.activity` is empty (mirrors the existing "No activity yet." on the Dashboard card).
- Opening the dropdown (`toggleNotif`) marks all entries `unread:false`, persists, updates the bell's dot indicator (dot only shows when at least one unread entry exists — currently it's always visible).

## New: real unread-message count

Add a `read` (bool) field to incoming messages (`me:false`), default `false`. Nav "Messages" badge and Dashboard's "Unread messages" stat both read `db.messages.filter(m => !m.me && !m.read).length` instead of the hardcoded `"1"`. Nav badge: renders only when the count is > 0 (same pattern the badge already uses today). Dashboard stat: always renders, shows the numeric count (including `0`), meta text becomes "All caught up" at `0` and "From {last sender}" otherwise. Visiting the Messages page (`goPage('messages')`) marks all messages `read:true`.

## Out of scope (explicit)

- New Supabase tables or schema.
- Realtime subscriptions / cross-device sync for anything except the existing client list.
- Service-layer / data-access-layer refactor.
- Optimistic UI, loading spinners, network error handling — no new async operations are introduced by this design.
