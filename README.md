# Arcen Digital — Client Onboarding Portal

A single, self-contained web app for onboarding new clients end to end:
enter their details once, and the personalised WhatsApp welcome message,
the invoice, and the service agreement are all generated automatically.
Keeps a running list of every client you've worked with.

## Files
- index.html   -> page structure (loads html2pdf for real PDF export)
- styles.css   -> all styling (dark app UI, white printable documents)
- app.js       -> all logic (data, rendering, interactions)

## The main flow (Client Onboarding page)
1. Fill in the client's business name, contact, WhatsApp number, email.
2. Set the pricing — website design, basic SEO, optional monthly hosting.
3. Click "Save client & generate everything".
   - A personalised welcome message is written for you (edit it freely).
   - The invoice line items and totals rebuild from the pricing you entered.
   - The service agreement updates with their details.
   - The client is added to your "Past Clients" list.
4. Click "Send via WhatsApp" — opens WhatsApp with the message pre-loaded,
   addressed to their number. (SA numbers like 082... auto-convert to +27.)
   Or "Copy message" to paste anywhere.

## Invoice -> PDF
Open the Invoice page and click "Export PDF" for a real downloadable .pdf,
or "Print" to use the browser print dialog. Click "Edit pricing" to jump
back to onboarding and change what it costs — the invoice updates on save.

## Past Clients
Every client you onboard is saved here with their project value and contact
details. Search them, WhatsApp them with one tap, load one back into the
portal to reuse their details, or remove them.

## Editing default content
Sample data lives at the top of app.js in the `DEFAULT` object.
Your banking details for the invoice are in DEFAULT.invoice.bank.
You can also edit invoice line items directly on the Settings page.

## Run it in VS Code
1. Open this folder in VS Code (File > Open Folder).
2. Install the "Live Server" extension (by Ritwick Dey).
3. Right-click index.html > "Open with Live Server".
Open it through Live Server (not by double-clicking index.html) so the
browser loads all three files together.

## Deploy (for phone / sharing)
This repo is connected to a Cloudflare Pages project via Git —
push to `master` and it redeploys automatically (build command: none,
output directory: `/`). No manual uploads needed.
Then "Add to Home Screen" on your phone.
All data is saved in the browser's local storage on the device you use.

## Cloud sync (Supabase) — one-time setup
The Past Clients list now syncs to a shared team database
(table `portal_clients` in your "Outreach Dashboard" Supabase project).
Everything else (invoice, agreement, messages) stays local per device.

Two steps to switch it on:

1. PASTE YOUR KEY
   - Supabase dashboard > Outreach Dashboard > Project Settings > API Keys
   - Copy the "publishable" key (starts with sb_publishable_...).
     The legacy "anon" key (starts with eyJ...) also works.
   - Open app.js, find PASTE_YOUR_PUBLISHABLE_KEY_HERE near the top,
     replace it with your key. Redeploy to Cloudflare.
   - This key is safe in frontend code — the table is protected by
     Row Level Security and requires login.

2. CREATE TEAM LOGINS (one per person: you, Tiaan, Ruben)
   - Supabase dashboard > Authentication > Users > Add user > Create new user
   - Enter email + password, tick "Auto Confirm User", save.
   - There is deliberately NO public sign-up in the app — only accounts
     you create here can see client data.

How it behaves:
- Until a key is pasted, the app runs exactly as before ("Local only").
- With a key, a team sign-in screen appears. "Continue offline" is always
  available if you just need the tools without the shared list.
- The chip in the top bar shows sync status (Cloud synced / Offline /
  Not signed in). Tap it to sync or sign in.
- If the connection drops, clients save to the device and push
  automatically on the next successful sync.
- Settings > Team account: sign out, sync now, see who's signed in.
