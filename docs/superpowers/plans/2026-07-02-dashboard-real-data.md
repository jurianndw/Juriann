# Dashboard Real Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every fabricated/hardcoded value from the dashboard and notification UI, and replace the empty-forever `db.activity` feed with one that's actually populated by real app events (new client, invoice created, payment received, milestone completed, project status changed, agreement signed).

**Architecture:** No new backend, no new files. Everything is additive/subtractive edits to the existing `app.js` (single global-scope script) and `index.html`, using the existing `db` object + `localStorage` persistence pattern already in place. One new choke-point function, `logActivity()`, becomes the single place that writes to `db.activity`; the Dashboard's "Recent activity" card and the notification bell dropdown both render from that same array.

**Tech Stack:** Vanilla JS (ES5-style, no build step), plain `index.html`/`app.js`/`styles.css`. No test framework exists in this repo and none is being introduced (would be scope creep for a 3-file static site).

## Global Constraints

- No new Supabase tables, no realtime subscriptions, no service-layer abstraction — spec explicitly scopes this to the existing `localStorage`-backed `db` object (see `docs/superpowers/specs/2026-07-02-dashboard-real-data-design.md`).
- This directory is not a git repository (confirmed at planning time) — steps that would normally say "commit" instead say "mark step complete"; there is no `git commit` step in this plan. If the user initializes a repo later, these changes can be committed as one unit.
- No automated test framework exists (no `package.json`, no test runner). Verification for every task is: (a) `node --check app.js` for syntax, and (b) a manual browser walkthrough via the Claude Preview tool (start the static server, navigate, click, and inspect `db` state via `preview_eval`). This is the same verification approach already used successfully earlier in this project.
- Reuse existing CSS classes wherever the shape matches — do not add new CSS. Confirmed reusable: `.mile/.mc/.mm/.mt/.md/.mr` (milestone rows, currently unused since the old Timeline page was deleted), `.notif/.nh/.ni/.nd/.nt/.nw` (notification dropdown, currently static HTML), `.act/.ai/.at/.aw` (activity rows, already wired to `actRow()`), `.pill ok`/`.pill acc` (status pills), `.g3` (3-column grid, already defined in `styles.css:99`).
- Icon names used below (`check`, `upload`, `route`, `card`, `file`, `msgico`) all already exist in the `ICONS` map in `app.js` — no new icons needed.

---

### Task 1: Activity log core + real notification bell

**Files:**
- Modify: `app.js` (DEFAULT object, `actRow`, `bootUI`, `toggleNotif`; new functions `logActivity`, `notifRow`, `renderNotif`)
- Modify: `index.html` (static notif dropdown markup, bell dot indicator)

**Interfaces:**
- Produces: `logActivity(icon: string, text: string): void` — pushes a real entry to `db.activity`, persists, re-renders the notification dropdown. This is the ONLY function later tasks should call to record an event.
- Produces: `renderNotif(): void` — re-renders `#notif` dropdown content and the bell's unread dot from `db.activity`. Safe to call any time (no-ops if `#notif` isn't in the DOM yet).
- Produces: `notifRow(a): string` — renders one `{icon, text, when, unread}` activity entry as dropdown-row HTML.
- Consumes: existing `db.activity` array (already in `DEFAULT`, already rendered by `actRow()` on the Dashboard), existing `persist()`, `esc()`, `nowTime()`.

- [ ] **Step 1: Update `actRow` to accept any icon name (currently hardcoded to only `check`/`upload`/`doc2`)**

In `app.js`, find:
```js
function actRow(a){
  return '<div class="act"><div class="ai">'+ic(a.icon==="check"?"check":a.icon==="upload"?"upload":"doc2")+'</div>'+
    '<div style="flex:1"><div class="at">'+esc(a.text)+'</div><div class="aw">'+esc(a.when)+'</div></div></div>';
}
```
Replace with:
```js
function actRow(a){
  return '<div class="act"><div class="ai">'+ic(a.icon)+'</div>'+
    '<div style="flex:1"><div class="at">'+esc(a.text)+'</div><div class="aw">'+esc(a.when)+'</div></div></div>';
}
```
(`ic()` already falls back to an empty glyph for unknown names via `ICONS[name]||""`, so this is safe and lets every real icon in `ICONS` be used for activity entries, not just two of them.)

- [ ] **Step 2: Add `logActivity`, `notifRow`, `renderNotif` right after `actRow`**

Insert immediately after the `actRow` function from Step 1:
```js
function logActivity(icon,text){
  db.activity.unshift({icon:icon,text:text,
    when:new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})+" · "+nowTime(),
    unread:true});
  if(db.activity.length>30)db.activity.length=30;
  persist();
  renderNotif();
}
function notifRow(a){
  return '<div class="ni"><div class="nd"'+(a.unread?"":' style="background:var(--grey-3)"')+'></div>'+
    '<div><div class="nt">'+esc(a.text)+'</div><div class="nw">'+esc(a.when)+'</div></div></div>';
}
function renderNotif(){
  var n=el("notif");if(!n)return;
  var unread=db.activity.filter(function(a){return a.unread;}).length;
  n.innerHTML='<div class="nh">Notifications'+(unread?' <span class="pill acc" style="font-size:10px">'+unread+' new</span>':'')+'</div>'+
    (db.activity.length?db.activity.slice(0,10).map(notifRow).join(""):'<div class="sub" style="font-size:12.5px;padding:14px 18px">No notifications yet.</div>');
  var dot=el("notifDot");if(dot)dot.style.display=unread?"block":"none";
}
```
`nowTime()` is defined later in the file (near `sendMsg`) but that's fine in non-strict function-scope JS — all top-level `function` declarations are hoisted before any of them run.

- [ ] **Step 3: Wire `renderNotif()` into boot and mark-as-read into `toggleNotif`**

Find:
```js
function bootUI(){
  setHeaderIdentity();
  applyTheme();buildNav();render();
}
```
Replace with:
```js
function bootUI(){
  setHeaderIdentity();
  applyTheme();buildNav();render();renderNotif();
}
```

Find:
```js
function toggleNotif(e){e.stopPropagation();el("notif").classList.toggle("show");}
function closeNotif(){el("notif").classList.remove("show");}
```
Replace with:
```js
function toggleNotif(e){
  e.stopPropagation();
  var n=el("notif");
  var opening=!n.classList.contains("show");
  n.classList.toggle("show");
  if(opening&&db.activity.some(function(a){return a.unread;})){
    db.activity.forEach(function(a){a.unread=false;});
    persist();renderNotif();
  }
}
function closeNotif(){el("notif").classList.remove("show");}
```

- [ ] **Step 4: Replace the static notification dropdown and bell dot in `index.html`**

Find:
```html
      <button class="iconbtn" onclick="toggleNotif(event)" title="Notifications"><span class="dot"></span>
        <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></button>
```
Replace with:
```html
      <button class="iconbtn" onclick="toggleNotif(event)" title="Notifications"><span class="dot" id="notifDot" style="display:none"></span>
        <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></button>
```

Find:
```html
<div class="notif" id="notif">
  <div class="nh">Notifications <span class="pill acc" style="font-size:10px">3 new</span></div>
  <div class="ni"><div class="nd"></div><div><div class="nt">Homepage design approved</div><div class="nw">Yesterday · 4:20 PM</div></div></div>
  <div class="ni"><div class="nd"></div><div><div class="nt">New message from Arcen</div><div class="nw">2 days ago</div></div></div>
  <div class="ni"><div class="nd" style="background:var(--ok)"></div><div><div class="nt">Contract signed</div><div class="nw">5 days ago</div></div></div>
</div>
```
Replace with:
```html
<div class="notif" id="notif"></div>
```

- [ ] **Step 5: Verify syntax**

Run: `node --check app.js`
Expected: no output, exit code 0.

- [ ] **Step 6: Manual browser verification**

Using the Claude Preview tool: start the static server, load the app, click "Continue offline" if the login gate appears, then in `preview_eval` run:
```js
(function(){
  logActivity("check","Test event");
  return {activityLen:db.activity.length, first:db.activity[0].text, dotDisplay:document.getElementById("notifDot").style.display};
})()
```
Expected: `activityLen` is 1, `first` is `"Test event"`, `dotDisplay` is `"block"`.
Then click the notification bell (`.iconbtn[title="Notifications"]`) and re-check `document.getElementById("notifDot").style.display` — expected `"none"` (marked read on open), and the dropdown should show "Test event" instead of the old static "Homepage design approved" content.

- [ ] **Step 7: Mark task complete** (no git repo — see Global Constraints)

---

### Task 2: Rebuild the Dashboard — remove fake cards, add real milestone checklist

**Files:**
- Modify: `app.js` (`pgDashboard`; new functions `mileRow`, `toggleMilestone`)

**Interfaces:**
- Consumes: `logActivity` from Task 1, existing `statCard`, `ic`, `esc`, `money`, `projectTotal`, `db.milestones`, `db.messages`.
- Produces: `mileRow(m, idx): string`, `toggleMilestone(idx: number): void`.

- [ ] **Step 1: Replace `pgDashboard` in full**

Find (current full function):
```js
function pgDashboard(){
  var p=db.project,inv=db.invoice;
  var done=db.milestones.filter(function(m){return m.done;}).length;
  var stage=db.milestones.filter(function(m){return !m.done;})[0];
  return '<div class="pagehead"><div class="eyebrow">'+greeting()+'</div>'+
    '<div class="h1" style="margin-top:8px">'+esc(db.client.name)+' 👋</div>'+
    '<div class="sub">Here'+"'"+'s where your project stands today.</div></div>'+
    '<div class="card pad" style="margin-bottom:16px">'+
      '<div class="eyebrow">Current project</div>'+
      '<div style="font-size:22px;font-weight:700;letter-spacing:-.02em;margin:8px 0 4px">'+esc(p.name)+'</div>'+
      '<div style="display:flex;gap:28px;margin-top:14px;flex-wrap:wrap">'+
        '<div><div class="cardlabel">Est. completion</div><b style="font-size:15px">'+esc(p.estCompletion)+'</b></div>'+
        '<div><div class="cardlabel">Milestones</div><b style="font-size:15px">'+done+' / '+db.milestones.length+'</b></div>'+
        '<div><div class="cardlabel">Status</div><span class="pill acc" style="margin-top:2px"><span class="d"></span>'+esc(p.status)+'</span></div>'+
      '</div>'+
    '</div>'+
    '<div class="grid g4" style="margin-bottom:16px">'+
      statCard("Current stage",stage?stage.name:"Complete",ic("route"),"Due "+(stage?stage.due:"—"))+
      statCard("Outstanding tasks","1",ic("clipboard"),"Awaiting review")+
      statCard("Invoice status",inv.status==="PAID"?"Paid":"Unpaid",ic("card"),money(projectTotal())+" total")+
      statCard("Unread messages","1",ic("msgico"),"From Arcen Digital")+
    '</div>'+
    '<div class="card pad"><div class="rowbetween"><div class="sectitle">Recent activity</div></div>'+
      (db.activity.length?db.activity.map(actRow).join(""):'<div class="sub" style="font-size:12.5px;padding:6px 0">No activity yet.</div>')+'</div>'+
    '<div class="grid g2 mt16">'+
      '<div class="card pad"><div class="sectitle" style="margin-bottom:14px">Upcoming meeting</div>'+
        '<div style="display:flex;gap:14px;align-items:center">'+
          '<div style="width:52px;height:52px;border-radius:14px;background:var(--acc-soft);display:flex;flex-direction:column;align-items:center;justify-content:center">'+
          '<span style="font-size:10px;color:var(--acc);font-weight:700;text-transform:uppercase">Jul</span><span style="font-size:19px;font-weight:700;color:var(--acc);line-height:1">09</span></div>'+
          '<div><div style="font-size:14px;font-weight:600">Design review call</div><div style="font-size:12.5px;color:var(--grey);margin-top:2px">14:00 · Google Meet</div></div>'+
          '<button class="btn sm" style="margin-left:auto" onclick="toast(\'No meeting link set yet — add one when you schedule the call\')">Join</button></div></div>'+
      '<div class="card pad"><div class="sectitle" style="margin-bottom:14px">Project health</div>'+
        healthRow("Budget","Within scope",100)+healthRow("Engagement","Excellent",88)+'</div>'+
    '</div>';
}
```
Replace with:
```js
function pgDashboard(){
  var p=db.project,inv=db.invoice;
  var done=db.milestones.filter(function(m){return m.done;}).length;
  var stage=db.milestones.filter(function(m){return !m.done;})[0];
  return '<div class="pagehead"><div class="eyebrow">'+greeting()+'</div>'+
    '<div class="h1" style="margin-top:8px">'+esc(db.client.name)+' 👋</div>'+
    '<div class="sub">Here'+"'"+'s where your project stands today.</div></div>'+
    '<div class="card pad" style="margin-bottom:16px">'+
      '<div class="eyebrow">Current project</div>'+
      '<div style="font-size:22px;font-weight:700;letter-spacing:-.02em;margin:8px 0 4px">'+esc(p.name)+'</div>'+
      '<div style="display:flex;gap:28px;margin-top:14px;flex-wrap:wrap">'+
        '<div><div class="cardlabel">Est. completion</div><b style="font-size:15px">'+esc(p.estCompletion)+'</b></div>'+
        '<div><div class="cardlabel">Milestones</div><b style="font-size:15px">'+done+' / '+db.milestones.length+'</b></div>'+
        '<div><div class="cardlabel">Status</div><span class="pill acc" style="margin-top:2px"><span class="d"></span>'+esc(p.status)+'</span></div>'+
      '</div>'+
    '</div>'+
    '<div class="grid g3" style="margin-bottom:16px">'+
      statCard("Current stage",stage?stage.name:"Complete",ic("route"),"Due "+(stage?stage.due:"—"))+
      statCard("Invoice status",inv.status==="PAID"?"Paid":"Unpaid",ic("card"),money(projectTotal())+" total")+
      statCard("Messages sent",String(db.messages.length),ic("msgico"),db.messages.length?("Last sent "+db.messages[db.messages.length-1].time):"No messages yet")+
    '</div>'+
    '<div class="card pad" style="margin-bottom:16px"><div class="rowbetween"><div class="sectitle">Recent activity</div></div>'+
      (db.activity.length?db.activity.map(actRow).join(""):'<div class="sub" style="font-size:12.5px;padding:6px 0">No activity yet.</div>')+'</div>'+
    '<div class="card pad"><div class="sectitle" style="margin-bottom:8px">Milestones</div>'+
      db.milestones.map(mileRow).join("")+
    '</div>';
}
function mileRow(m,idx){
  return '<div class="mile" onclick="toggleMilestone('+idx+')"><div class="mc '+(m.done?"done":"todo")+'">'+(m.done?ic("check"):'<i></i>')+'</div>'+
    '<div class="mm"><div class="mt">'+esc(m.name)+'</div><div class="md">'+esc(m.desc)+'</div></div>'+
    '<div class="mr">'+(m.done?"Done":"Due "+esc(m.due))+'</div></div>';
}
function toggleMilestone(idx){
  var m=db.milestones[idx];if(!m)return;
  m.done=!m.done;
  if(m.done)logActivity("check","Milestone complete: "+m.name);
  persist();render();
}
```

- [ ] **Step 2: Delete the now-dead `healthRow` function**

This edit removes the only caller of `healthRow` (confirmed via `grep -n healthRow app.js` — it has exactly one call site, inside the "Project health" card just deleted, and one definition). Find:
```js
function healthRow(label,val,pct){
  return '<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;margin-bottom:7px">'+
    '<span style="font-size:13px;font-weight:500">'+label+'</span><span style="font-size:12px;color:var(--ok);font-weight:600">'+val+'</span></div>'+
    '<div class="pbar"><i style="width:'+pct+'%"></i></div></div>';
}
```
Delete it entirely (no replacement).

- [ ] **Step 4: Verify syntax**

Run: `node --check app.js`
Expected: no output, exit code 0.

- [ ] **Step 5: Manual browser verification**

Reload the app in the preview, go to Dashboard. Confirm via `preview_snapshot` or `preview_screenshot`: no "Upcoming meeting" card, no "Project health" card, no "Outstanding tasks" or "Unread messages" stat tiles, and a new "Milestones" card listing all 8 milestones with checkboxes (reusing the same visual style the old, now-deleted Timeline page used).

Click the first milestone row, then in `preview_eval` run:
```js
({done:db.milestones[0].done, activityText:db.activity[0].text})
```
Expected: `done:true`, `activityText` starts with `"Milestone complete:"`. Click it again and confirm `db.milestones[0].done` is back to `false` (no new activity entry is logged on un-checking, by design — only completion is logged).

- [ ] **Step 6: Mark task complete**

---

### Task 3: Log real events at existing save points (new client, invoice created, payment received, status changed)

**Files:**
- Modify: `app.js` (`upsertClient`, `onboardSave`, `saveSettings`)

**Interfaces:**
- Consumes: `logActivity` from Task 1.
- Changes `upsertClient()`'s return type from `undefined` to `boolean` (`true` when the saved client is new). No existing caller relies on its return value being `undefined`, so this is safe.

- [ ] **Step 1: Make `upsertClient` report whether the client is new**

Find:
```js
function upsertClient(){
  var c=db.client,t=invTotals();
  var i=db.clients.findIndex(function(x){return x.company.toLowerCase()===c.company.toLowerCase();});
  var rec={company:c.company,contact:c.contact,name:c.name,phone:c.phone,email:c.email,address:c.address,
    project:db.project.name,value:t.grand,date:new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}),
    status:db.invoice.status==="PAID"?"Completed":"Active"};
  if(i>=0){rec.id=db.clients[i].id;rec.date=db.clients[i].date;db.clients[i]=rec;}else{db.clients.unshift(rec);}
  cloudSaveClient(rec);
}
```
Replace with:
```js
function upsertClient(){
  var c=db.client,t=invTotals();
  var i=db.clients.findIndex(function(x){return x.company.toLowerCase()===c.company.toLowerCase();});
  var rec={company:c.company,contact:c.contact,name:c.name,phone:c.phone,email:c.email,address:c.address,
    project:db.project.name,value:t.grand,date:new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}),
    status:db.invoice.status==="PAID"?"Completed":"Active"};
  var isNew=i<0;
  if(i>=0){rec.id=db.clients[i].id;rec.date=db.clients[i].date;db.clients[i]=rec;}else{db.clients.unshift(rec);}
  cloudSaveClient(rec);
  return isNew;
}
```

- [ ] **Step 2: Log "new client" and "invoice created" in `onboardSave`**

Find:
```js
  /* generate message + save into client history */
  db.welcomeMsg=buildWelcomeMsg();
  upsertClient();
  persist();
  setHeaderIdentity();
  render();
  toast("Saved — message, invoice & agreement updated");
}
```
Replace with:
```js
  /* generate message + save into client history */
  db.welcomeMsg=buildWelcomeMsg();
  var isNewClient=upsertClient();
  if(isNewClient)logActivity("check","New client added: "+c.company);
  logActivity("upload","Invoice "+inv.number+" created for "+c.company);
  persist();
  setHeaderIdentity();
  render();
  toast("Saved — message, invoice & agreement updated");
}
```

- [ ] **Step 3: Log "payment received" and "project status changed" in `saveSettings`**

Find:
```js
function saveSettings(){
  var g=function(id){var e=el(id);return e?e.value:"";};
  var c=db.client,p=db.project,inv=db.invoice,a=db.agreement;
  c.name=g("s_name")||c.name;c.company=g("s_company");c.contact=g("s_contact");c.email=g("s_email");c.phone=g("s_phone");c.address=g("s_address");
  p.name=g("s_pname");p.status=g("s_status");p.estCompletion=g("s_est");p.objective=g("s_obj");
  inv.bank.name=g("s_bizname")||inv.bank.name;
  inv.number=g("s_invno");inv.status=(g("s_invstatus")||"UNPAID").toUpperCase();inv.bank.bankName=g("s_bank");inv.bank.acc=g("s_acc");inv.bank.branch=g("s_branch");inv.vat=parseFloat(g("s_vat"))||0;
  inv.discount=parseFloat(g("s_disc"))||0;inv.due=g("s_due")||inv.due;
  var items=readLineItems();if(items.length)inv.items=items;
  a.number=g("s_agrno");a.revisions=parseInt(g("s_rev"))||3;a.deposit=parseInt(g("s_dep"))||50;a.balance=parseInt(g("s_bal"))||50;
  setHeaderIdentity();
  upsertClient();
  persist();render();toast("Settings saved — documents updated");
}
```
Replace with:
```js
function saveSettings(){
  var g=function(id){var e=el(id);return e?e.value:"";};
  var c=db.client,p=db.project,inv=db.invoice,a=db.agreement;
  var oldStatus=p.status,oldInvStatus=inv.status;
  c.name=g("s_name")||c.name;c.company=g("s_company");c.contact=g("s_contact");c.email=g("s_email");c.phone=g("s_phone");c.address=g("s_address");
  p.name=g("s_pname");p.status=g("s_status");p.estCompletion=g("s_est");p.objective=g("s_obj");
  inv.bank.name=g("s_bizname")||inv.bank.name;
  inv.number=g("s_invno");inv.status=(g("s_invstatus")||"UNPAID").toUpperCase();inv.bank.bankName=g("s_bank");inv.bank.acc=g("s_acc");inv.bank.branch=g("s_branch");inv.vat=parseFloat(g("s_vat"))||0;
  inv.discount=parseFloat(g("s_disc"))||0;inv.due=g("s_due")||inv.due;
  var items=readLineItems();if(items.length)inv.items=items;
  a.number=g("s_agrno");a.revisions=parseInt(g("s_rev"))||3;a.deposit=parseInt(g("s_dep"))||50;a.balance=parseInt(g("s_bal"))||50;
  if(p.status!==oldStatus)logActivity("route","Project status changed to "+p.status);
  if(inv.status==="PAID"&&oldInvStatus!=="PAID")logActivity("card","Payment received — invoice "+inv.number);
  setHeaderIdentity();
  upsertClient();
  persist();render();toast("Settings saved — documents updated");
}
```

- [ ] **Step 4: Verify syntax**

Run: `node --check app.js`
Expected: no output, exit code 0.

- [ ] **Step 5: Manual browser verification**

In the preview, go to Client Onboarding, fill in "Business name" and "First name", click "Save client & generate everything". In `preview_eval`:
```js
db.activity.slice(0,2).map(function(a){return a.text;})
```
Expected: an array of 2 strings — one starting `"New client added:"`, one starting `"Invoice"`.

Then go to Settings, change "Status (PAID / UNPAID)" to `PAID` and click "Save changes". In `preview_eval`:
```js
db.activity[0].text
```
Expected: starts with `"Payment received"`.

- [ ] **Step 6: Mark task complete**

---

### Task 4: Real agreement-signing state

**Files:**
- Modify: `app.js` (`DEFAULT.agreement`, `pgAgreement`; new function `markSigned`)

**Interfaces:**
- Consumes: `logActivity` from Task 1.
- Produces: `markSigned(): void`, and two new fields on `db.agreement`: `signed: boolean`, `signedDate: string`.

- [ ] **Step 1: Add `signed`/`signedDate` to `DEFAULT.agreement`**

Find:
```js
  agreement:{number:"AGR-0001",date:"",deposit:50,balance:50,revisions:3},
```
Replace with:
```js
  agreement:{number:"AGR-0001",date:"",deposit:50,balance:50,revisions:3,signed:false,signedDate:""},
```

- [ ] **Step 2: Add the "Mark as signed" control to the agreement doc bar**

Find:
```js
    '<div class="docbar no-print"><div><div class="h1" style="font-size:22px">Service Agreement</div><div class="sub" style="margin-top:4px">'+esc(a.number)+' · '+esc(a.date)+'</div></div>'+
      '<div style="display:flex;gap:10px">'+
        '<button class="btn sm" onclick="window.print()">'+ic("print")+'Print</button>'+
        '<button class="btn pri sm" onclick="exportPDF()">'+ic("download")+'Export PDF</button></div></div>'+
```
Replace with:
```js
    '<div class="docbar no-print"><div><div class="h1" style="font-size:22px">Service Agreement</div><div class="sub" style="margin-top:4px">'+esc(a.number)+' · '+esc(a.date)+'</div></div>'+
      '<div style="display:flex;gap:10px;align-items:center">'+
        (a.signed?'<span class="pill ok"><span class="d"></span>Signed '+esc(a.signedDate)+'</span>':
          '<button class="btn sm" onclick="markSigned()">'+ic("check")+'Mark as signed</button>')+
        '<button class="btn sm" onclick="window.print()">'+ic("print")+'Print</button>'+
        '<button class="btn pri sm" onclick="exportPDF()">'+ic("download")+'Export PDF</button></div></div>'+
```

- [ ] **Step 3: Add `markSigned`**

Insert right after the `pgAgreement` function (before `function pgMessages(){`):
```js
function markSigned(){
  if(!confirm("Mark this agreement as signed by "+(db.client.company||db.client.name)+"?"))return;
  db.agreement.signed=true;
  db.agreement.signedDate=new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});
  logActivity("check","Agreement signed by "+(db.client.company||db.client.name));
  persist();render();toast("Agreement marked as signed");
}
```

- [ ] **Step 4: Verify syntax**

Run: `node --check app.js`
Expected: no output, exit code 0.

- [ ] **Step 5: Manual browser verification**

In the preview, go to Service Agreement. Confirm a "Mark as signed" button is visible next to Print/Export PDF. In `preview_eval`, stub `confirm` and click it:
```js
window.confirm=function(){return true;};
document.querySelector('[onclick="markSigned()"]').click();
({signed:db.agreement.signed, activityText:db.activity[0].text})
```
Expected: `signed:true`, `activityText` starts with `"Agreement signed by"`. Reload the Agreement page (`goPage('agreement')` then re-render) and confirm the button is replaced by a "Signed {date}" pill.

- [ ] **Step 6: Mark task complete**

---

### Task 5: Remove the fake Messages auto-reply and the dead unread badge

**Files:**
- Modify: `app.js` (`sendMsg`, `buildNav`)

**Interfaces:** None (leaf cleanup task, no new functions).

- [ ] **Step 1: Remove the simulated auto-reply**

Find:
```js
function sendMsg(){
  var i=el("msgInput");if(!i||!i.value.trim())return;
  db.messages.push({me:true,who:"You",text:i.value.trim(),time:nowTime()});
  persist();render();
  setTimeout(function(){
    db.messages.push({me:false,who:"Arcen Digital",text:"Thanks — got it. We'll get back to you shortly.",time:nowTime()});
    persist();if(current==="messages")render();toast("New reply from Arcen");
  },1400);
}
```
Replace with:
```js
function sendMsg(){
  var i=el("msgInput");if(!i||!i.value.trim())return;
  db.messages.push({me:true,who:"You",text:i.value.trim(),time:nowTime()});
  persist();render();
}
```

- [ ] **Step 2: Remove the hardcoded "1" nav badge (no real unread concept exists — `me:false` messages can no longer be created after Step 1)**

Find:
```js
function buildNav(){
  var byId={};PAGES.forEach(function(p){byId[p[0]]=p;});
  el("nav").innerHTML=NAV_GROUPS.map(function(g){
    var items=g[1].map(function(id){
      var p=byId[id];if(!p)return "";
      var badge=id==="messages"?'<span class="badge">1</span>':"";
      return '<button class="navitem'+(id===current?" on":"")+'" data-page="'+id+'" onclick="goPage(\''+id+'\')">'+
        ic(p[2])+'<span>'+p[1]+'</span>'+badge+'</button>';
    }).join("");
    return '<div class="navgroup"><div class="navlabel">'+g[0]+'</div>'+items+'</div>';
  }).join("");
}
```
Replace with:
```js
function buildNav(){
  var byId={};PAGES.forEach(function(p){byId[p[0]]=p;});
  el("nav").innerHTML=NAV_GROUPS.map(function(g){
    var items=g[1].map(function(id){
      var p=byId[id];if(!p)return "";
      return '<button class="navitem'+(id===current?" on":"")+'" data-page="'+id+'" onclick="goPage(\''+id+'\')">'+
        ic(p[2])+'<span>'+p[1]+'</span></button>';
    }).join("");
    return '<div class="navgroup"><div class="navlabel">'+g[0]+'</div>'+items+'</div>';
  }).join("");
}
```

- [ ] **Step 3: Verify syntax**

Run: `node --check app.js`
Expected: no output, exit code 0.

- [ ] **Step 4: Manual browser verification**

In the preview, go to Messages, send a message, wait ~2 seconds. Confirm via `preview_eval` (`db.messages.length`) that only one message was added (not two), and no toast reading "New reply from Arcen" appears. Confirm the "Messages" nav item no longer shows a badge.

- [ ] **Step 5: Full end-to-end smoke pass**

Reload the app fresh (clear `localStorage` via `preview_eval: localStorage.clear(); location.reload();`), click "Continue offline", and walk every nav item (Dashboard, Client Onboarding, Service Agreement, Invoice, Messages, Past Clients, Settings) taking a screenshot of each. Confirm: no console errors (`preview_console_logs` level `error`), no leftover references to removed concepts (search page text for "Upcoming meeting", "Project health", "Outstanding tasks", "Unread messages" — none should appear).

- [ ] **Step 6: Mark task complete**
