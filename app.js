"use strict";
var KEY="arcen_portal_v1";
var clientsView={sort:null,dir:1,filter:"all",q:"",page:1,selected:{},pageIndices:[]};
var onboardStep=1;
var profileIdx=-1;
var TEAM=["Juriann","Tiaan","Ruben"];
var invoiceShowDoc=true;
var invoiceListView={filter:"all"};

/* ==================================================================
   SUPABASE — shared client database (Outreach Dashboard project)
   Paste your key below: Supabase dashboard > Project Settings >
   API Keys > "publishable" key (starts with sb_publishable_...).
   The legacy "anon" key (starts with eyJ...) also works.
   This key is safe to ship in frontend code — the database is
   protected by Row Level Security and requires team login.
   ================================================================== */
var SUPA_URL="https://gpecltbdiyqqynemlbda.supabase.co";
var SUPA_KEY="sb_publishable_iB_x52O4aGTYryy0WPmyHQ_NDeXyIjd";

/* ---------- default data ---------- */
var DEFAULT={
  theme:"light",
  sidebarCollapsed:false,
  client:{name:"",company:"",contact:"",email:"",phone:"",address:""},
  project:{name:"Website Project",objective:"",status:"Not started",estCompletion:"",manager:"Arcen Digital",progress:0,
    audience:[],
    goals:["Increase credibility","Increase enquiries","Improve SEO","Fast loading","Mobile friendly","Easy to maintain"],
    deliverables:["Custom Website","Mobile Responsive","Contact Forms","Basic SEO Setup","Hosting Configuration","Analytics"]},
  invoice:{number:"INV-0001",issue:"",due:"",status:"UNPAID",vat:0,discount:0,
    items:[{desc:"Website Design & Development",note:"Custom responsive build",qty:1,price:0},
           {desc:"Basic SEO Setup",note:"On-page SEO, schema, sitemap & Google indexing",qty:1,price:0}],
    bank:{name:"Arcen Digital",acc:"[Your account number]",bankName:"[Your bank]",branch:"[Branch code]"}},
  agreement:{number:"AGR-0001",date:"",deposit:50,balance:50,revisions:3,signed:false,signedDate:""},
  milestones:[
    {name:"Discovery",done:false,due:"",desc:"Requirements gathering and brand review"},
    {name:"Strategy",done:false,due:"",desc:"Sitemap, content plan and direction"},
    {name:"Wireframes",done:false,due:"",desc:"Low-fidelity structure of all pages"},
    {name:"Homepage Design",done:false,due:"",desc:"High-fidelity homepage concept"},
    {name:"Remaining Pages",done:false,due:"",desc:"Design of inner pages"},
    {name:"Development",done:false,due:"",desc:"Build, integration and forms"},
    {name:"Testing",done:false,due:"",desc:"Cross-device QA and performance"},
    {name:"Launch",done:false,due:"",desc:"Go live and handover"}],
  activity:[],
  welcomeMsg:"",
  monthly:{enabled:false,price:0,label:"Hosting & Maintenance"},
  clients:[]
};

var db=clone(DEFAULT);
var current="dashboard";

var PAGES=[
  ["dashboard","Dashboard","grid"],
  ["onboard","Client Onboarding","sparkle"],
  ["agreement","Service Agreement","file"],
  ["invoice","Invoices","card"],
  ["clients","Clients","users"],
  ["settings","Settings","gear"]
];

/* Sidebar grouped by domain, not by workflow step — calmer, less "wizard" */
var NAV_GROUPS=[
  ["",           ["dashboard"]],
  ["Clients",    ["onboard","clients"]],
  ["Documents",  ["agreement","invoice"]],
  ["Workspace",  ["settings"]]
];

var ICONS={
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  sparkle:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8L21.5 17l-1.8.7L19 19.5l-.7-1.8L16.5 17l1.8-.5z"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2.5"/><line x1="2" y1="10" x2="22" y2="10"/>',
  route:'<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a3 3 0 0 0 3-3V8"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  clipboard:'<rect x="8" y="3" width="8" height="4" rx="1.5"/><path d="M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/><polyline points="9 14 11 16 15 12"/>',
  chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4.5A8.4 8.4 0 1 1 21 11.5z"/>',
  chart:'<line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="9"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  check:'<polyline points="20 6 9 17 4 12"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>',
  print:'<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
  msgico:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4.5A8.4 8.4 0 1 1 21 11.5z"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="15" y2="7"/><line x1="9" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="15" y2="12"/>',
  palette:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="10" r="1"/>',
  doc2:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><path d="M16 4.2a3.5 3.5 0 0 1 0 6.8"/>',
  globe:'<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  zip:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="12" y1="11" x2="12" y2="17"/>',
  design:'<path d="M12 2l3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7L2 9.5 9 9z"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  chevronLeft:'<polyline points="15 18 9 12 15 6"/>',
  chevronRight:'<polyline points="9 18 15 12 9 6"/>',
  eye:'<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>'
};
/* keyboard equivalent for the div-based clickable rows below -- Enter/Space
   triggers the same onclick already on the element, so no handler logic is
   duplicated; role="button" + tabindex make it a real stop in the tab order */
var KBD_ACT=' tabindex="0" role="button" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click();}"';
/* WhatsApp brand mark (filled, official glyph) */
var WA_LOGO='<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;stroke:none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

/* ---------- utils ---------- */
function clone(o){return JSON.parse(JSON.stringify(o));}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function money(n){var x=Math.round(Number(n)||0);return "R "+String(x).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
function el(id){return document.getElementById(id);}
function ic(name,cls){return '<svg viewBox="0 0 24 24" '+(cls?'class="'+cls+'"':'')+'>'+(ICONS[name]||"")+'</svg>';}
function initials(n){var p=String(n||"").trim().split(/\s+/).map(function(w){return w[0]||"";});return (p.join("").toUpperCase().slice(0,2))||"?";}

/* ---------- empty states ---------- */
/* full-page empty state: icon badge + title + helpful text + optional CTA */
function emptyState(icon,title,text,ctaInner,ctaAction){
  return '<div class="empty-state">'+
    '<div class="empty-ico">'+ic(icon)+'</div>'+
    '<div class="empty-title">'+esc(title)+'</div>'+
    '<div class="empty-text">'+esc(text)+'</div>'+
    (ctaInner?'<button class="btn pri" onclick="'+ctaAction+'">'+ctaInner+'</button>':'')+
  '</div>';
}
/* compact, card-embedded empty state: small icon + text, no CTA (the composer/action
   is already visible right next to it) -- tone "ok" for a reassuring "nothing to do"
   state rather than a "nothing here yet" one */
function emptyMini(icon,text,tone){
  return '<div class="empty-mini'+(tone==="ok"?" ok":"")+'"><div class="empty-mini-ico">'+ic(icon)+'</div>'+
    '<div class="empty-mini-text">'+esc(text)+'</div></div>';
}

function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(db));}
  catch(e){if(typeof toast==="function")toast("Storage full — this change may not have saved. Remove a file or photo to free up space.");}
}
function restore(){
  try{
    var r=JSON.parse(localStorage.getItem(KEY));
    if(r&&r.client){
      db=r;
      /* migrate: fill any keys added in newer versions */
      Object.keys(DEFAULT).forEach(function(k){if(db[k]===undefined)db[k]=clone(DEFAULT[k]);});
      if(!db.clients)db.clients=[];
      /* backfill per-client extras on records saved before they existed */
      db.clients.forEach(function(x){applyClientMeta(x,x);applyClientSnapshot(x,x);});
    }
  }catch(e){db=clone(DEFAULT);}
}

/* invoice math */
function calcInvoiceTotals(inv){
  var sub=(inv.items||[]).reduce(function(a,i){return a+(Number(i.qty)||0)*(Number(i.price)||0);},0);
  var vat=sub*(Number(inv.vat)||0)/100;
  var disc=Number(inv.discount)||0;
  return {sub:sub,vat:vat,disc:disc,grand:sub+vat-disc};
}
function invTotals(){return calcInvoiceTotals(db.invoice);
}
function projectTotal(){return invTotals().grand;}

/* ---------- ring ---------- */
function ring(pct,size){
  size=size||132;var r=(size-16)/2;var c=2*Math.PI*r;var off=c*(1-pct/100);
  var id="g"+Math.floor(Math.random()*99999);
  return '<div class="ring" style="width:'+size+'px;height:'+size+'px">'+
    '<svg width="'+size+'" height="'+size+'"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1">'+
    '<stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--acc-2)"/></linearGradient></defs>'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="var(--ring-track)" stroke-width="8"/>'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="url(#'+id+')" stroke-width="8" '+
    'stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+c.toFixed(1)+'" '+
    'style="transition:stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)" data-off="'+off.toFixed(1)+'"/></svg>'+
    '<div class="rv"><b>'+pct+'%</b><span>Complete</span></div></div>';
}
function animateRings(){
  var cs=document.querySelectorAll("circle[data-off]");
  setTimeout(function(){cs.forEach(function(c){c.style.strokeDashoffset=c.getAttribute("data-off");});},60);
}

/* ---------- nav ---------- */
function buildNav(){
  var byId={};PAGES.forEach(function(p){byId[p[0]]=p;});
  el("nav").innerHTML=NAV_GROUPS.map(function(g){
    var items=g[1].map(function(id){
      var p=byId[id];if(!p)return "";
      var handler=id==="invoice"?"goInvoiceList()":"goPage('"+id+"')";
      return '<button class="navitem'+(id===current?" on":"")+'" data-page="'+id+'" title="'+esc(p[1])+'"'+
        (id===current?' aria-current="page"':'')+' onclick="'+handler+'">'+
        ic(p[2])+'<span>'+p[1]+'</span></button>';
    }).join("");
    return '<div class="navgroup">'+(g[0]?'<div class="navlabel">'+g[0]+'</div>':"")+items+'</div>';
  }).join("");
}
function goPage(id){
  if(!PAGES.some(function(p){return p[0]===id;}))id="dashboard";
  if(id==="invoice")invoiceShowDoc=true; /* every direct "view/open invoice" caller means the document, not the list */
  current=id;
  buildNav();
  var t=PAGES.filter(function(p){return p[0]===id;})[0];
  el("crumb").textContent=t?t[1]:id;
  render();
  el("scroll").scrollTop=0;
  closeMobileNav();
}
function goInvoiceList(){
  invoiceShowDoc=false;
  current="invoice";
  buildNav();
  el("crumb").textContent="Invoices";
  render();
  el("scroll").scrollTop=0;
  closeMobileNav();
}

/* ---------- render dispatch ---------- */
function render(){
  var s=el("scroll");
  var html="";
  if(current==="dashboard")html=pgDashboard();
  else if(current==="onboard")html=pgOnboard();
  else if(current==="clients")html=pgClients();
  else if(current==="agreement")html=pgAgreement();
  else if(current==="invoice")html=invoiceShowDoc?pgInvoice():pgInvoiceList();
  else if(current==="settings")html=pgSettings();
  else if(current==="profile")html=pgProfile();
  s.innerHTML='<div class="page active">'+html+'</div>';
  animateRings();
}

/* ---------- pages ---------- */
function pgDashboard(){
  var c=db.client,p=db.project,inv=db.invoice;
  var total=db.milestones.length;
  var done=db.milestones.filter(function(m){return m.done;}).length;
  var pct=total?Math.round(done/total*100):0;
  var nextIdx=db.milestones.findIndex(function(m){return !m.done;});
  var nextMile=nextIdx>=0?db.milestones[nextIdx]:null;
  var title=c.name?esc(c.name):"Welcome back";
  var lede;
  if(!c.name)lede="Add your first client and their invoice, agreement, and welcome message are generated for you.";
  else if(inv.status!=="PAID")lede="Invoice "+esc(inv.number)+" for "+esc(c.company||c.name)+" is still unpaid.";
  else if(nextMile)lede="Next up: "+esc(nextMile.name)+".";
  else if(pct===100)lede="Every milestone is complete — nicely done.";
  else lede="Here's where things stand today.";

  var unpaid=[];
  db.clients.forEach(function(x,i){if(x.status!=="Completed")unpaid.push({x:x,i:i});});

  return '<div class="dash">'+
    '<div class="dash-hero">'+
      '<div class="dash-eyebrow">'+greeting()+'</div>'+
      '<div class="dash-title">'+title+'</div>'+
      '<div class="dash-lede">'+lede+'</div>'+
    '</div>'+

    '<div class="dash-focal">'+
      '<div class="dash-ring">'+ring(pct,172)+'</div>'+
      '<div class="dash-facts">'+
        '<div class="dash-eyebrow">Current project</div>'+
        '<div class="dash-facts-title">'+esc(p.name)+'</div>'+
        '<div class="dash-fact"><span>Status</span><span class="pill '+(pct===100?"ok":"acc")+'"><span class="d"></span>'+esc(p.status)+'</span></div>'+
        '<div class="dash-fact"><span>Milestones</span><b>'+done+' of '+total+'</b></div>'+
        '<div class="dash-fact"><span>Est. completion</span><b>'+(p.estCompletion?esc(p.estCompletion):"—")+'</b></div>'+
      '</div>'+
    '</div>'+

    (db.clients.length?attentionSec(unpaid):"")+
    quickActionsSec()+

    '<div class="dash-stats">'+
      dashStat("Invoice",inv.status==="PAID"?"Paid":"Unpaid",money(projectTotal())+" total")+
    '</div>'+

    '<div class="dash-sec">'+
      '<div class="dash-sec-head"><div class="dash-sec-title">Milestones</div>'+
        '<div class="dash-sec-note">'+done+' / '+total+' complete</div></div>'+
      '<div>'+db.milestones.map(function(m,idx){return mileRow(m,idx,idx===nextIdx);}).join("")+'</div>'+
    '</div>'+

    '<div class="dash-sec">'+
      '<div class="dash-sec-head"><div class="dash-sec-title">Recent activity</div></div>'+
      (db.activity.length?'<div>'+db.activity.map(actRow).join("")+'</div>'
        :emptyMini("clock","Nothing yet. Saving a client, sending an invoice, or completing a milestone shows up here."))+
    '</div></div>';
}
function attentionSec(unpaid){
  var shown=unpaid.slice(0,4);
  var extra=unpaid.length-shown.length;
  return '<div class="dash-sec">'+
    '<div class="dash-sec-head"><div class="dash-sec-title">Needs attention</div>'+
      (unpaid.length?'<div class="dash-sec-note">'+unpaid.length+' outstanding</div>':"")+'</div>'+
    (shown.length?'<div>'+shown.map(attnRow).join("")+'</div>'+
        (extra>0?'<div class="dash-more" onclick="goPage(\'clients\')"'+KBD_ACT+'>+'+extra+' more in Past Clients</div>':"")
      :emptyMini("check","Nothing outstanding — every client is settled up.","ok"))+
  '</div>';
}
function attnRow(row){
  var x=row.x,i=row.i;
  return '<div class="dash-attn" onclick="loadClient('+i+')"'+KBD_ACT+'>'+
    '<div class="uava">'+initials(x.company)+'</div>'+
    '<div style="flex:1;min-width:0"><div class="nm">'+esc(x.company)+'</div><div class="ds">'+esc(x.project)+' · '+money(x.value)+'</div></div>'+
    '<button class="iconbtn" title="Message '+esc(x.company)+'" onclick="event.stopPropagation();waTo(\''+esc(x.phone)+'\',\''+esc(x.name||x.contact)+'\')">'+WA_LOGO+'</button>'+
  '</div>';
}
function quickActionsSec(){
  return '<div class="dash-quick">'+
    qaBtn("sparkle","New client","goPage('onboard')")+
    qaBtn("card","Invoices","goInvoiceList()")+
    qaBtn("users","Past Clients","goPage('clients')")+
  '</div>';
}
function qaBtn(icon,label,action){
  return '<button class="dash-qa" onclick="'+action+'">'+ic(icon)+'<span>'+esc(label)+'</span></button>';
}
function dashStat(k,v,m){
  return '<div class="dash-stat"><div class="k">'+esc(k)+'</div><div class="v">'+v+'</div><div class="m">'+esc(m)+'</div></div>';
}
function mileRow(m,idx,cur){
  var right=m.done?"Done":(cur?"Up next":(m.due?"Due "+esc(m.due):"—"));
  return '<div class="dash-mile'+(m.done?" done":"")+(cur?" current":"")+'" onclick="toggleMilestone('+idx+')"'+KBD_ACT+'>'+
    '<div class="dash-check">'+(m.done?ic("check"):"")+'</div>'+
    '<div style="flex:1;min-width:0"><div class="nm">'+esc(m.name)+'</div><div class="ds">'+esc(m.desc)+'</div></div>'+
    '<div class="due">'+right+'</div></div>';
}
function popCheckThenRender(scopeSelector,idx,isDone){
  var reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  var row=document.querySelectorAll(scopeSelector)[idx];
  if(isDone&&row&&!reduced){
    row.classList.add("done");
    var chk=row.querySelector(".dash-check");
    chk.innerHTML=ic("check");
    chk.classList.add("pop");
    setTimeout(render,380);
  }else{
    render();
  }
}
function toggleMilestone(idx){
  var m=db.milestones[idx];if(!m)return;
  m.done=!m.done;
  if(m.done)logActivity("check","Milestone complete: "+m.name);
  persist();
  popCheckThenRender(".dash-mile",idx,m.done);
}
function actRow(a){
  return '<div class="dash-act"><div class="ico">'+ic(a.icon)+'</div>'+
    '<div style="flex:1"><div class="tx">'+esc(a.text)+'</div><div class="tm">'+esc(a.when)+'</div></div></div>';
}
function logActivity(icon,text){
  db.activity.unshift({icon:icon,text:text,
    when:new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})+" · "+nowTime()});
  if(db.activity.length>30)db.activity.length=30;
  persist();
}
function greeting(){var h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening";}

/* ==================================================================
   CLIENT ONBOARDING — enter details once, everything else fills itself
   ================================================================== */
var ONBOARD_STEPS=[{n:1,t:"Client details"},{n:2,t:"Project & pricing"},{n:3,t:"Welcome message"}];
function wizIndicator(){
  return '<div class="wizsteps">'+ONBOARD_STEPS.map(function(s,idx){
    var cls=s.n===onboardStep?"on":(s.n<onboardStep?"done":"");
    var line=idx<ONBOARD_STEPS.length-1?'<div class="wizline"></div>':"";
    return '<div class="wizstep '+cls+'" onclick="onboardNav('+s.n+')" aria-label="Step '+s.n+': '+esc(s.t)+'"'+KBD_ACT+'><span class="wizdot">'+
      (s.n<onboardStep?ic("check"):s.n)+'</span><span class="wizlabel">'+s.t+'</span></div>'+line;
  }).join("")+'</div>';
}
function pgOnboard(){
  var c=db.client,p=db.project,inv=db.invoice,m=db.monthly;
  var web=inv.items[0]||{price:12000},seo=inv.items[1]||{price:2500};
  var body;
  if(onboardStep===1){
    body='<div class="card pad"><div class="sectitle" style="margin-bottom:6px">Client details</div>'+
      '<div class="sub" style="margin-bottom:22px;font-size:12.5px">Who are we building this for? Business name and first name are the only two required to continue.</div>'+
      '<div class="setgrid">'+
        setField("ob_company","Business name",c.company)+
        setField("ob_contact","Contact person (full name)",c.contact)+
        setField("ob_name","First name (used in messages)",c.name)+
        setField("ob_phone","WhatsApp number",c.phone,"text","e.g. 082 123 4567 — used by the Send via WhatsApp button")+
        setField("ob_email","Email",c.email,"text","Optional — only needed if you'd rather email the welcome message")+
        setField("ob_address","Address / town",c.address)+
      '</div>'+
      '<div style="display:flex;justify-content:flex-end;margin-top:22px">'+
        '<button class="btn pri" onclick="onboardNav(2)">Continue'+ic("chevronRight")+'</button></div>'+
    '</div>';
  }else if(onboardStep===2){
    body='<div class="card pad"><div class="sectitle" style="margin-bottom:6px">Project &amp; pricing</div>'+
      '<div class="sub" style="margin-bottom:22px;font-size:12.5px">Set the scope and what this project is worth.</div>'+
      '<div class="setgrid">'+
        setField("ob_pname","Project name",p.name)+
        setField("ob_est","Estimated completion",p.estCompletion)+
        setField("ob_web","Website design & development (R)",web.price,"number")+
        setField("ob_seo","Basic SEO setup (R)",seo.price,"number")+
        setField("ob_dep","Deposit %",db.agreement.deposit,"number","Collected upfront; the rest becomes the balance due on completion")+
        setField("ob_due","Invoice due date",inv.due)+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:14px;margin-top:20px;flex-wrap:wrap">'+
        '<label style="display:flex;align-items:center;gap:9px;font-size:13px;cursor:pointer"><input type="checkbox" id="ob_mo" '+(m.enabled?"checked":"")+' style="accent-color:var(--acc);width:16px;height:16px"> Monthly hosting & maintenance</label>'+
        '<div class="f" style="width:200px;margin:0"><input id="ob_moprice" type="number" value="'+esc(m.price)+'" placeholder=" "><label>Monthly amount (R)</label></div>'+
        '<span class="cardlabel">billed 12 months on invoice</span>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;margin-top:22px">'+
        '<button class="btn" onclick="onboardNav(1)">'+ic("chevronLeft")+'Back</button>'+
        '<button class="btn pri" onclick="onboardNav(3)">Continue'+ic("chevronRight")+'</button></div>'+
    '</div>';
  }else{
    body='<div class="card pad"><div class="rowbetween" style="margin-bottom:12px"><div class="sectitle">Welcome message</div>'+
      '<button class="btn sm" onclick="regenMsg()">'+ic("sparkle")+'Regenerate</button></div>'+
      '<div class="sub" style="margin-bottom:16px;font-size:12.5px">Edit freely below — the WhatsApp button sends exactly what'+"'"+'s in this box.</div>'+
      '<div class="f full"><textarea id="ob_msg" style="min-height:270px;font-size:13.5px;line-height:1.65;padding-top:16px" oninput="db.welcomeMsg=this.value;persist()">'+esc(db.welcomeMsg||buildWelcomeMsg())+'</textarea></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px;flex-wrap:wrap;gap:12px">'+
        '<button class="btn" onclick="onboardNav(2)">'+ic("chevronLeft")+'Back</button>'+
        '<button class="btn pri" onclick="onboardFinish()">'+ic("check")+'Save client & generate everything</button></div>'+
      '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">'+
        '<button class="btn wa" onclick="openWhatsApp()">'+WA_LOGO+'Send via WhatsApp</button>'+
        '<button class="btn" onclick="copyMsg()">'+ic("copy")+'Copy message</button>'+
        '<button class="btn" onclick="goPage(\'invoice\')">'+ic("card")+'View invoice</button>'+
        '<button class="btn" onclick="goPage(\'agreement\')">'+ic("file")+'View agreement</button>'+
      '</div></div>';
  }
  return '<div class="pagehead"><div class="h1">Client Onboarding</div><div class="sub">Fill in the client'+"'"+'s details — the welcome message, invoice and agreement are generated automatically as you go.</div></div>'+
    wizIndicator()+body;
}

function buildWelcomeMsg(){
  var c=db.client,p=db.project,inv=db.invoice,a=db.agreement,t=invTotals();
  var dep=Math.round(t.grand*a.deposit/100);
  var lines=[
    "Hi "+c.name+"! 👋",
    "",
    "Welcome aboard — we're excited to officially kick off the new website for *"+c.company+"* with Arcen Digital.",
    "",
    "Here's what your project includes:",
    "✅ Custom website design & development",
    "✅ Basic SEO setup (Google-ready from day one)"
  ];
  if(db.monthly.enabled)lines.push("✅ "+db.monthly.label+" ("+money(db.monthly.price)+"/month)");
  lines=lines.concat([
    "",
    "📋 Project: "+p.name,
    "💰 Total investment: "+money(t.grand),
    "🔐 Deposit to begin: "+money(dep)+" ("+a.deposit+"%)",
    "📅 Estimated completion: "+p.estCompletion,
    "",
    "Next steps:",
    "1. Your invoice ("+inv.number+") and service agreement are on their way.",
    "2. Once the deposit reflects, work starts immediately.",
    "3. You'll receive a link to your own client portal to track progress live.",
    "",
    "Any questions — just reply here, I'm one message away.",
    "",
    "Juriann",
    "Arcen Digital · arcen.digital"
  ]);
  return lines.join("\n");
}
function regenMsg(){
  db.welcomeMsg=buildWelcomeMsg();persist();
  var t=el("ob_msg");if(t)t.value=db.welcomeMsg;
  toast("Message regenerated from current details");
}
function onboardValidateStep1(){
  var errs={};
  if(!el("ob_company").value.trim())errs.ob_company="Business name is required";
  if(!el("ob_name").value.trim())errs.ob_name="First name is required";
  var email=el("ob_email").value.trim();
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errs.ob_email="Enter a valid email address";
  return errs;
}
function showFieldErrors(errs){
  document.querySelectorAll(".f.err").forEach(function(f){f.classList.remove("err");});
  document.querySelectorAll(".f-err").forEach(function(e){e.textContent="";});
  var first=null;
  Object.keys(errs).forEach(function(id){
    var input=el(id);if(!input)return;
    var f=input.closest(".f");if(f)f.classList.add("err");
    var msg=el(id+"_err");if(msg)msg.textContent=errs[id];
    if(!first)first=input;
  });
  if(first)first.focus();
}
function onboardSaveStep(step){
  var g=function(id){var e=el(id);return e?e.value.trim():"";};
  var c=db.client,p=db.project,inv=db.invoice;
  if(step===1){
    c.company=g("ob_company");c.contact=g("ob_contact")||g("ob_name");c.name=g("ob_name");
    c.phone=g("ob_phone");c.email=g("ob_email");c.address=g("ob_address");
  }else if(step===2){
    p.name=g("ob_pname")||"Business Website";p.estCompletion=g("ob_est")||p.estCompletion;
    db.agreement.deposit=Math.max(0,Math.min(100,parseInt(g("ob_dep"))||50));
    db.agreement.balance=100-db.agreement.deposit;
    inv.due=g("ob_due")||inv.due;
    var webP=parseFloat(g("ob_web"))||0,seoP=parseFloat(g("ob_seo"))||0;
    var mo=el("ob_mo"),moP=parseFloat(g("ob_moprice"))||0;
    db.monthly.enabled=!!(mo&&mo.checked);db.monthly.price=moP;
    /* rebuild invoice line items from pricing */
    inv.items=[
      {desc:"Website Design & Development",note:"Custom responsive build for "+c.company,qty:1,price:webP},
      {desc:"Basic SEO Setup",note:"On-page SEO, schema, sitemap & Google indexing",qty:1,price:seoP}
    ];
    if(db.monthly.enabled&&moP>0)inv.items.push({desc:db.monthly.label+" (12 mo)",note:"Managed hosting + monthly support",qty:12,price:moP});
  }
  persist();
}
function onboardNav(target){
  if(target>onboardStep&&onboardStep===1){
    var errs=onboardValidateStep1();
    if(Object.keys(errs).length){showFieldErrors(errs);return;}
  }
  onboardSaveStep(onboardStep);
  onboardStep=target;
  render();
}
function onboardFinish(){
  var c=db.client,inv=db.invoice;
  db.welcomeMsg=el("ob_msg")?el("ob_msg").value:buildWelcomeMsg();
  var isNewClient=upsertClient();
  if(isNewClient)logActivity("check","New client added: "+c.company);
  logActivity("upload","Invoice "+inv.number+" created for "+c.company);
  persist();
  setHeaderIdentity();
  toast("Saved — message, invoice & agreement updated");
}
/* per-client extras (photo/timeline/notes/tasks/files/messages/document snapshots) are
   local-only -- the shared Supabase table only ever carries the lightweight summary
   fields (see clientToRow), so these never leave this device. applyClientMeta preserves
   them across re-onboarding the same client; applyClientSnapshot does the same for the
   project/invoice/agreement documents, falling back to sane defaults for a client that
   was onboarded by a teammate on another device and has never been opened here. */
function applyClientMeta(rec,src){
  src=src||{};
  rec.photo=src.photo||"";
  rec.milestones=src.milestones?clone(src.milestones):clone(DEFAULT.milestones);
  rec.notes=src.notes?clone(src.notes):[];
  rec.tasks=src.tasks?clone(src.tasks):[];
  rec.files=src.files?clone(src.files):[];
  rec.messages=src.messages?clone(src.messages):[];
  rec.assignedTo=src.assignedTo?clone(src.assignedTo):[];
  rec.activity=src.activity?clone(src.activity):[];
}
function applyClientSnapshot(rec,src){
  src=src||{};
  if(src.projectInfo)rec.projectInfo=clone(src.projectInfo);
  else{rec.projectInfo=clone(DEFAULT.project);rec.projectInfo.name=rec.project||"";rec.projectInfo.status=rec.status||"Active";}
  if(src.invoice)rec.invoice=clone(src.invoice);
  else{rec.invoice=clone(DEFAULT.invoice);rec.invoice.status=rec.status==="Completed"?"PAID":"UNPAID";}
  rec.agreement=src.agreement?clone(src.agreement):clone(DEFAULT.agreement);
}
function upsertClient(){
  var c=db.client,t=invTotals();
  var i=db.clients.findIndex(function(x){return x.company.toLowerCase()===c.company.toLowerCase();});
  var rec={company:c.company,contact:c.contact,name:c.name,phone:c.phone,email:c.email,address:c.address,
    project:db.project.name,value:t.grand,date:new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}),
    status:db.invoice.status==="PAID"?"Completed":"Active"};
  var isNew=i<0;
  if(i>=0){rec.id=db.clients[i].id;rec.date=db.clients[i].date;applyClientMeta(rec,db.clients[i]);}
  else{applyClientMeta(rec,null);}
  /* onboarding is the authoritative editor for the project/invoice/agreement documents,
     so these always snapshot fresh from the live editing slots, never preserved from before */
  rec.projectInfo=clone(db.project);rec.invoice=clone(db.invoice);rec.agreement=clone(db.agreement);
  if(i>=0)db.clients[i]=rec;else db.clients.unshift(rec);
  cloudSaveClient(rec);
  return isNew;
}

/* WhatsApp helpers */
function waNumber(phone){
  var d=String(phone||"").replace(/\D/g,"");
  if(d.charAt(0)==="0")d="27"+d.slice(1);      /* SA local -> international */
  return d;
}
function openWhatsApp(){
  var t=el("ob_msg");var msg=t?t.value:(db.welcomeMsg||buildWelcomeMsg());
  var n=waNumber(db.client.phone);
  if(!n){toast("Add the client's WhatsApp number first");return;}
  window.open("https://wa.me/"+n+"?text="+encodeURIComponent(msg),"_blank");
}
function waTo(phone,name){
  var n=waNumber(phone);
  if(!n){toast("No phone number saved for this client");return;}
  window.open("https://wa.me/"+n+"?text="+encodeURIComponent("Hi "+(name||"")+"! 👋 It's Juriann from Arcen Digital — "),"_blank");
}
function copyMsg(){
  var t=el("ob_msg");if(!t)return;
  var done=function(){toast("Message copied — paste it anywhere");};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(done,function(){t.select();document.execCommand("copy");done();});}
  else{t.select();document.execCommand("copy");done();}
}

/* ==================================================================
   PAST CLIENTS — every business you've onboarded, in one list
   ================================================================== */
function pgClients(){
  if(cloudReady())syncClients();
  if(cloudReady()&&syncing&&!db.clients.length)return pgClientsSkeleton();
  var v=clientsView;
  var total=db.clients.reduce(function(a,x){return a+(Number(x.value)||0);},0);
  var head='<div class="pagehead"><div class="rowbetween"><div><div class="h1">Past Clients</div>'+
    '<div class="sub">'+db.clients.length+' client'+(db.clients.length===1?"":"s")+' · '+money(total)+' total project value'+(CLOUD_ON?' · shared team list':'')+'</div></div>'+
    '<div style="display:flex;gap:8px">'+
    (CLOUD_ON?'<button class="btn sm" onclick="syncClients(true);toast(\'Syncing with the cloud…\')">'+ic("upload")+'Sync</button>':'')+
    '<button class="btn pri sm" onclick="goPage(\'onboard\')">'+ic("plus")+'New client</button></div></div></div>';

  if(!db.clients.length){
    return head+'<div class="card pad">'+emptyState("users","No clients yet",
      "Onboard your first client and they'll appear here automatically with their project value and contact details.",
      ic("sparkle")+"Start onboarding","goPage('onboard')")+'</div>';
  }

  var searched=db.clients.map(function(x,i){return {x:x,i:i};});
  if(v.q){
    var q=v.q.toLowerCase();
    searched=searched.filter(function(r){return (r.x.company+" "+r.x.contact).toLowerCase().indexOf(q)>=0;});
  }
  var countAll=searched.length;
  var countActive=searched.filter(function(r){return r.x.status!=="Completed";}).length;
  var countCompleted=searched.filter(function(r){return r.x.status==="Completed";}).length;

  var rows=searched;
  if(v.filter==="active")rows=rows.filter(function(r){return r.x.status!=="Completed";});
  else if(v.filter==="completed")rows=rows.filter(function(r){return r.x.status==="Completed";});

  if(v.sort){
    rows=rows.slice().sort(function(a,b){
      var av=sortVal(a.x,v.sort),bv=sortVal(b.x,v.sort);
      if(av<bv)return -1*v.dir;if(av>bv)return 1*v.dir;return 0;
    });
  }

  var pageSize=10;
  var totalPages=Math.max(1,Math.ceil(rows.length/pageSize));
  if(v.page>totalPages)v.page=totalPages;
  if(v.page<1)v.page=1;
  var pageRows=rows.slice((v.page-1)*pageSize,v.page*pageSize);
  v.pageIndices=pageRows.map(function(r){return r.i;});

  var selCount=Object.keys(v.selected).filter(function(k){return v.selected[k];}).length;
  var allOnPageSelected=pageRows.length>0&&pageRows.every(function(r){return v.selected[r.i];});

  var toolbar='<div class="tbl-toolbar">'+
    '<div class="search" style="margin:0;max-width:300px"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>'+
    '<input id="clientSearch" placeholder="Search clients" value="'+esc(v.q)+'" oninput="searchClients(this.value)"></div>'+
    '<div class="tbl-filters">'+
      filterTab("all","All",countAll)+filterTab("active","Active",countActive)+filterTab("completed","Completed",countCompleted)+
    '</div></div>';

  var bulkBar=selCount?'<div class="tbl-bulk"><div>'+selCount+' selected</div><div style="display:flex;gap:8px">'+
      '<button class="btn sm" onclick="bulkMarkCompleted()">'+ic("check")+'Mark completed</button>'+
      '<button class="btn sm" onclick="bulkRemoveClients()">'+ic("trash")+'Remove</button>'+
      '<button class="btn ghost sm" onclick="clearClientSelection()">Cancel</button>'+
    '</div></div>':"";

  var table='<div class="tbl-wrap">'+
    '<div class="tbl-head">'+
      '<div class="tbl-check"><input type="checkbox" '+(allOnPageSelected?"checked":"")+' onchange="toggleSelectAllClients(this.checked)"></div>'+
      sortHead("company","Company")+sortHead("project","Project")+sortHead("value","Value")+sortHead("status","Status")+sortHead("date","Since")+
      '<div></div>'+
    '</div>'+
    pageRows.map(clientRow).join("")+
  '</div>';

  var pager=totalPages>1?'<div class="tbl-pager">'+
    '<button class="btn sm" '+(v.page<=1?"disabled":"")+' onclick="changeClientsPage(-1)">Prev</button>'+
    '<span>Page '+v.page+' of '+totalPages+'</span>'+
    '<button class="btn sm" '+(v.page>=totalPages?"disabled":"")+' onclick="changeClientsPage(1)">Next</button>'+
  '</div>':"";

  return head+toolbar+bulkBar+table+pager;
}
function sortVal(x,key){
  if(key==="value")return Number(x.value)||0;
  if(key==="date"){var t=new Date(x.date).getTime();return isNaN(t)?0:t;}
  return String(x[key]||"").toLowerCase();
}
function sortHead(key,label){
  var on=clientsView.sort===key;
  return '<div class="tbl-th'+(on?" on":"")+'" onclick="sortClients(\''+key+'\')">'+esc(label)+(on?(clientsView.dir===1?" ↑":" ↓"):"")+'</div>';
}
function filterTab(key,label,count){
  return '<button class="tbl-tab'+(clientsView.filter===key?" on":"")+'" onclick="setClientFilter(\''+key+'\')">'+esc(label)+' <span>'+count+'</span></button>';
}
function searchClients(q){clientsView.q=q;clientsView.page=1;render();}
function setClientFilter(f){clientsView.filter=f;clientsView.page=1;render();}
function sortClients(key){
  if(clientsView.sort===key)clientsView.dir=-clientsView.dir;
  else{clientsView.sort=key;clientsView.dir=1;}
  render();
}
function changeClientsPage(delta){clientsView.page+=delta;render();}
function toggleClientSelect(i){clientsView.selected[i]=!clientsView.selected[i];render();}
function toggleSelectAllClients(checked){
  clientsView.pageIndices.forEach(function(i){clientsView.selected[i]=checked;});
  render();
}
function clearClientSelection(){clientsView.selected={};render();}
function bulkMarkCompleted(){
  var idxs=Object.keys(clientsView.selected).filter(function(k){return clientsView.selected[k];}).map(Number);
  if(!idxs.length)return;
  idxs.forEach(function(i){
    var x=db.clients[i];if(!x)return;
    x.status="Completed";
    if(x.invoice)x.invoice.status="PAID";
    cloudSaveClient(x);
  });
  clientsView.selected={};
  persist();render();toast(idxs.length+" client"+(idxs.length>1?"s":"")+" marked completed");
}
function bulkRemoveClients(){
  var idxs=Object.keys(clientsView.selected).filter(function(k){return clientsView.selected[k];}).map(Number);
  if(!idxs.length)return;
  if(!confirm("Remove "+idxs.length+" client"+(idxs.length>1?"s":"")+" from your client history?"))return;
  idxs.sort(function(a,b){return b-a;});
  idxs.forEach(function(i){
    var x=db.clients[i];if(!x)return;
    cloudDeleteClient(x);
    db.clients.splice(i,1);
  });
  clientsView.selected={};
  persist();render();toast("Clients removed");
}
function clientRow(row){
  var x=row.x,i=row.i;
  var checked=!!clientsView.selected[i];
  return '<div class="tbl-row'+(checked?" sel":"")+'" onclick="toggleClientSelect('+i+')"'+KBD_ACT+'>'+
    '<div class="tbl-check"><input type="checkbox" '+(checked?"checked":"")+' onclick="event.stopPropagation()" onchange="toggleClientSelect('+i+')"></div>'+
    '<div style="display:flex;align-items:center;gap:12px;min-width:0">'+
      '<div class="uava" style="width:34px;height:34px;font-size:12.5px;flex:none">'+initials(x.company)+'</div>'+
      '<div style="min-width:0"><div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(x.company)+'</div>'+
        '<div style="font-size:12px;color:var(--grey-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(x.contact)+'</div></div>'+
    '</div>'+
    '<div class="tbl-cell-muted">'+esc(x.project)+'</div>'+
    '<div style="font-size:13.5px;font-weight:500;font-variant-numeric:tabular-nums">'+money(x.value)+'</div>'+
    '<div><span class="pill '+(x.status==="Completed"?"ok":"acc")+'"><span class="d"></span>'+esc(x.status)+'</span></div>'+
    '<div class="tbl-cell-muted">'+esc(x.date)+'</div>'+
    '<div class="row-actions" onclick="event.stopPropagation()">'+
      '<button class="iconbtn" title="View profile" onclick="openProfile('+i+')" style="width:30px;height:30px">'+ic("eye")+'</button>'+
      '<button class="iconbtn" title="WhatsApp" onclick="waTo(\''+esc(x.phone)+'\',\''+esc(x.name||x.contact)+'\')" style="width:30px;height:30px;color:#25D366">'+WA_LOGO+'</button>'+
      '<button class="iconbtn" title="Load into portal" onclick="loadClient('+i+')" style="width:30px;height:30px">'+ic("upload")+'</button>'+
      '<button class="iconbtn" title="Remove" onclick="removeClient('+i+')" style="width:30px;height:30px">'+ic("trash")+'</button>'+
    '</div>'+
  '</div>';
}
function loadClient(i){
  var x=db.clients[i];if(!x)return;
  db.client.company=x.company;db.client.contact=x.contact;db.client.name=x.name||x.contact.split(" ")[0];
  db.client.phone=x.phone;db.client.email=x.email;db.client.address=x.address||"";
  /* restore this client's own project/invoice/agreement/milestones snapshot, not just
     the project name -- otherwise loading an old client kept whatever pricing/terms
     happened to be active from the last client instead of their real numbers */
  db.project=x.projectInfo?clone(x.projectInfo):db.project;
  if(x.project)db.project.name=x.project;
  if(x.invoice)db.invoice=clone(x.invoice);
  if(x.agreement)db.agreement=clone(x.agreement);
  if(x.milestones)db.milestones=clone(x.milestones);
  db.welcomeMsg="";persist();
  setHeaderIdentity();
  goPage("onboard");
  toast(x.company+" loaded — review details and regenerate");
}
function removeClient(i){
  var x=db.clients[i];if(!x)return;
  if(!confirm("Remove "+x.company+" from your client history?"))return;
  cloudDeleteClient(x);
  db.clients.splice(i,1);clientsView.selected={};persist();render();toast("Client removed");
}

/* ==================================================================
   CLIENT PROFILE — everything about one client, on one page
   ================================================================== */
function openProfile(i){
  if(!db.clients[i])return;
  profileIdx=i;
  current="profile";
  buildNav();
  el("crumb").textContent=db.clients[i].company||"Client profile";
  render();
  el("scroll").scrollTop=0;
  closeMobileNav();
}
function infoLine(label,val){
  return '<div class="info-line"><span class="k">'+esc(label)+'</span><span class="v">'+
    (val?esc(val):'<span class="empty">—</span>')+'</span></div>';
}
function fileSize(n){
  n=Number(n)||0;
  if(n<1024)return n+" B";
  if(n<1048576)return (n/1024).toFixed(1)+" KB";
  return (n/1048576).toFixed(1)+" MB";
}
function profMileRow(m,idx){
  return '<div class="dash-mile'+(m.done?" done":"")+'" onclick="toggleProfMilestone('+idx+')"'+KBD_ACT+'>'+
    '<div class="dash-check">'+(m.done?ic("check"):"")+'</div>'+
    '<div style="flex:1;min-width:0"><div class="nm">'+esc(m.name)+'</div><div class="ds">'+esc(m.desc)+'</div></div>'+
    '<div class="due">'+(m.done?"Done":(m.due?"Due "+esc(m.due):"—"))+'</div></div>';
}
function toggleProfMilestone(idx){
  var x=db.clients[profileIdx];if(!x||!x.milestones)return;
  var m=x.milestones[idx];if(!m)return;
  m.done=!m.done;
  if(m.done)logProfActivity(x,"check","Milestone complete: "+m.name);
  persist();
  popCheckThenRender("#profMiles .dash-mile",idx,m.done);
}
function logProfActivity(x,icon,text){
  if(!x.activity)x.activity=[];
  x.activity.unshift({icon:icon,text:text,
    when:new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})+" · "+nowTime()});
  if(x.activity.length>20)x.activity.length=20;
}
function profActRow(a){
  return '<div class="dash-act"><div class="ico">'+ic(a.icon)+'</div>'+
    '<div style="flex:1"><div class="tx">'+esc(a.text)+'</div><div class="tm">'+esc(a.when)+'</div></div></div>';
}
function toggleProfAssignee(name){
  var x=db.clients[profileIdx];if(!x)return;
  if(!x.assignedTo)x.assignedTo=[];
  var idx=x.assignedTo.indexOf(name);
  if(idx>=0){x.assignedTo.splice(idx,1);logProfActivity(x,"users","Unassigned "+name);}
  else{x.assignedTo.push(name);logProfActivity(x,"users","Assigned "+name);}
  persist();render();
}
function profTaskRow(tk,idx){
  return '<div class="dash-mile'+(tk.done?" done":"")+'" onclick="toggleProfTask('+idx+')"'+KBD_ACT+'>'+
    '<div class="dash-check">'+(tk.done?ic("check"):"")+'</div>'+
    '<div style="flex:1;min-width:0"><div class="nm">'+esc(tk.text)+'</div></div>'+
    '<button class="iconbtn" style="width:30px;height:30px" onclick="event.stopPropagation();removeProfTask('+idx+')" title="Remove">'+ic("trash")+'</button>'+
  '</div>';
}
function addProfTask(){
  var x=db.clients[profileIdx];if(!x)return;
  var i=el("profTaskInput");if(!i||!i.value.trim())return;
  if(!x.tasks)x.tasks=[];
  x.tasks.push({text:i.value.trim(),done:false});
  logProfActivity(x,"plus","Task added: "+i.value.trim());
  persist();render();
}
function toggleProfTask(idx){
  var x=db.clients[profileIdx];if(!x||!x.tasks)return;
  var tk=x.tasks[idx];if(!tk)return;
  tk.done=!tk.done;
  if(tk.done)logProfActivity(x,"check","Task completed: "+tk.text);
  persist();
  popCheckThenRender("#profTasksList .dash-mile",idx,tk.done);
}
function removeProfTask(idx){
  var x=db.clients[profileIdx];if(!x||!x.tasks)return;
  x.tasks.splice(idx,1);persist();render();
}
function addProfNote(){
  var x=db.clients[profileIdx];if(!x)return;
  var i=el("profNoteInput");if(!i||!i.value.trim())return;
  if(!x.notes)x.notes=[];
  x.notes.unshift({text:i.value.trim(),time:nowTime()+" · "+new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})});
  logProfActivity(x,"clipboard","Note added");
  persist();render();
}
function removeProfNote(idx){
  var x=db.clients[profileIdx];if(!x||!x.notes)return;
  x.notes.splice(idx,1);persist();render();
}
function profLogMsg(asMe){
  var x=db.clients[profileIdx];if(!x)return;
  var i=el("profMsgInput");if(!i||!i.value.trim())return;
  if(!x.messages)x.messages=[];
  x.messages.push({me:asMe,who:asMe?"You":(x.name||x.contact||"Client"),text:i.value.trim(),time:nowTime()});
  persist();render();
}
function handleProfilePhoto(input){
  var f=input.files&&input.files[0];if(!f)return;
  if(f.size>1500000){toast("Image too large — please use one under 1.5MB");return;}
  var reader=new FileReader();
  reader.onload=function(){
    var x=db.clients[profileIdx];if(!x)return;
    x.photo=reader.result;logProfActivity(x,"image","Photo updated");persist();render();toast("Photo updated");
  };
  reader.readAsDataURL(f);
}
function handleProfileFile(input){
  var f=input.files&&input.files[0];if(!f)return;
  if(f.size>2000000){toast("File too large — please use one under 2MB");return;}
  var reader=new FileReader();
  reader.onload=function(){
    var x=db.clients[profileIdx];if(!x)return;
    if(!x.files)x.files=[];
    x.files.push({name:f.name,size:f.size,type:f.type||"",dataUrl:reader.result,time:nowTime()});
    logProfActivity(x,"upload","File added: "+f.name);
    persist();render();toast("File added");
  };
  reader.readAsDataURL(f);
}
function removeProfileFile(idx){
  var x=db.clients[profileIdx];if(!x||!x.files)return;
  x.files.splice(idx,1);persist();render();
}
function pgProfile(){
  var x=db.clients[profileIdx];
  if(!x){
    return '<div class="pagehead"><div class="h1">Client not found</div><div class="sub">It may have been removed from Past Clients.</div></div>'+
      '<button class="btn" onclick="goPage(\'clients\')">'+ic("chevronLeft")+'Back to Past Clients</button>';
  }
  var pi=x.projectInfo||{},inv=x.invoice||{items:[]},t=calcInvoiceTotals(inv);
  var miles=x.milestones||[],doneMiles=miles.filter(function(m){return m.done;}).length;
  var pct=miles.length?Math.round(doneMiles/miles.length*100):0;
  var assigned=x.assignedTo||[];

  var back='<button class="btn ghost sm" style="margin-bottom:14px" onclick="goPage(\'clients\')">'+ic("chevronLeft")+'Back to Past Clients</button>';

  var hero='<div class="card pad profile-hero" style="margin-bottom:16px">'+
    '<div class="profile-ava-wrap">'+
      (x.photo?'<img class="profile-ava" src="'+x.photo+'">':'<div class="profile-ava profile-ava-fallback">'+initials(x.company)+'</div>')+
      '<label class="profile-ava-edit" title="Change photo">'+ic("image")+'<input type="file" accept="image/*" style="display:none" onchange="handleProfilePhoto(this)"></label>'+
    '</div>'+
    '<div style="flex:1;min-width:220px">'+
      '<div class="rowbetween" style="margin-bottom:2px;align-items:flex-start">'+
        '<div class="sectitle" style="font-size:21px">'+esc(x.company)+'</div>'+
        '<span class="pill '+(x.status==="Completed"?"ok":"acc")+'"><span class="d"></span>'+esc(x.status)+'</span>'+
      '</div>'+
      '<div class="sub" style="font-size:13px">'+esc(x.contact||x.name||"")+(x.email?" · "+esc(x.email):"")+(x.phone?" · "+esc(x.phone):"")+'</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">'+
        '<button class="btn wa sm" onclick="waTo(\''+esc(x.phone)+'\',\''+esc(x.name||x.contact)+'\')">'+WA_LOGO+'WhatsApp</button>'+
        '<button class="btn sm" onclick="loadClient('+profileIdx+')">'+ic("upload")+'Load into portal</button>'+
        '<button class="btn sm" onclick="loadClient('+profileIdx+');goPage(\'invoice\')">'+ic("card")+'Open invoice</button>'+
        '<button class="btn sm" onclick="loadClient('+profileIdx+');goPage(\'agreement\')">'+ic("file")+'Open agreement</button>'+
      '</div>'+
    '</div></div>';

  var infoRow='<div class="profile-row">'+
    '<div class="card pad"><div class="sectitle" style="margin-bottom:12px">Company &amp; contact</div>'+
      infoLine("Business name",x.company)+infoLine("Contact person",x.contact)+
      infoLine("Email",x.email)+infoLine("Phone",x.phone)+infoLine("Address",x.address)+
    '</div>'+
    '<div class="card pad">'+
      '<div class="rowbetween" style="margin-bottom:14px;align-items:flex-start">'+
        '<div class="sectitle">Project</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">'+
          '<span class="pill '+(pct===100?"ok":"acc")+'"><span class="d"></span>'+esc(pi.status||"—")+'</span>'+
          '<span class="pill '+(inv.status==="PAID"?"ok":"warn")+'"><span class="d"></span>'+esc(inv.status||"UNPAID")+'</span>'+
        '</div></div>'+
      '<div class="rowbetween" style="margin-bottom:6px"><span class="cardlabel">Completion</span>'+
        '<span style="font-size:13px;font-weight:600;color:var(--white)">'+pct+'%</span></div>'+
      '<div class="progress-bar" style="margin-bottom:16px"><div class="progress-bar-fill" style="width:'+pct+'%"></div></div>'+
      infoLine("Project name",pi.name)+infoLine("Est. completion",pi.estCompletion)+infoLine("Invoice total",money(t.grand))+
      '<div style="margin-top:16px"><div class="cardlabel" style="margin-bottom:9px">Assigned</div>'+
        '<div class="assignee-row">'+TEAM.map(function(n){
          var on=assigned.indexOf(n)>=0;
          return '<div class="assignee-chip'+(on?" on":"")+'" onclick="toggleProfAssignee(\''+n+'\')"'+KBD_ACT+'><span class="ava">'+initials(n)+'</span>'+esc(n)+'</div>';
        }).join("")+'</div></div>'+
    '</div></div>';

  var timelineCard='<div class="card pad" style="margin-bottom:16px">'+
    '<div class="rowbetween" style="margin-bottom:10px"><div class="sectitle">Timeline</div>'+
      '<div class="cardlabel">'+doneMiles+' / '+miles.length+' · '+pct+'%</div></div>'+
    '<div class="progress-bar" style="margin-bottom:14px"><div class="progress-bar-fill" style="width:'+pct+'%"></div></div>'+
    '<div id="profMiles">'+miles.map(profMileRow).join("")+'</div></div>';

  var commCard='<div class="card pad" style="margin-bottom:16px"><div class="sectitle" style="margin-bottom:14px">Recent communication</div>'+
    '<div class="thread">'+((x.messages&&x.messages.length)?x.messages.map(function(m){
      return '<div class="msg '+(m.me?"me":"them")+'"><div class="who">'+esc(m.who)+'</div>'+esc(m.text)+'<div class="tm">'+esc(m.time)+'</div></div>';
    }).join(""):emptyMini("chat","No messages logged yet."))+'</div>'+
    '<div class="composer"><input id="profMsgInput" placeholder="Log a message…" onkeydown="if(event.key===\'Enter\')profLogMsg(true)">'+
      '<button class="btn sm" onclick="profLogMsg(false)">Log reply</button>'+
      '<button class="btn pri sm" onclick="profLogMsg(true)">'+ic("upload")+'Log sent</button></div>'+
  '</div>';

  var notesCard='<div class="card pad"><div class="sectitle" style="margin-bottom:10px">Notes</div>'+
    ((x.notes&&x.notes.length)?'<div>'+x.notes.map(function(n,idx){
      return '<div class="note-item"><div class="note-tx">'+esc(n.text)+'</div>'+
        '<div class="note-meta"><span>'+esc(n.time)+'</span>'+
        '<button class="iconbtn" style="width:26px;height:26px" onclick="removeProfNote('+idx+')" title="Delete">'+ic("trash")+'</button></div></div>';
    }).join(""):emptyMini("clipboard","No notes yet."))+
    '<div class="composer" style="margin-top:12px"><input id="profNoteInput" placeholder="Add a note…" onkeydown="if(event.key===\'Enter\')addProfNote()">'+
      '<button class="btn sm" onclick="addProfNote()">'+ic("plus")+'Add</button></div>'+
  '</div>';

  var tasksCard='<div class="card pad"><div class="sectitle" style="margin-bottom:10px">Tasks</div>'+
    ((x.tasks&&x.tasks.length)?'<div id="profTasksList">'+x.tasks.map(profTaskRow).join("")+'</div>':emptyMini("plus","No tasks yet."))+
    '<div class="composer" style="margin-top:12px"><input id="profTaskInput" placeholder="Add a task…" onkeydown="if(event.key===\'Enter\')addProfTask()">'+
      '<button class="btn sm" onclick="addProfTask()">'+ic("plus")+'Add</button></div>'+
  '</div>';

  var activityCard='<div class="card pad" style="margin-bottom:16px"><div class="sectitle" style="margin-bottom:10px">Activity feed</div>'+
    ((x.activity&&x.activity.length)?'<div>'+x.activity.map(profActRow).join("")+'</div>'
      :emptyMini("route","Nothing yet — updates to this client"+"'"+"s timeline, tasks, notes and files show up here."))+
  '</div>';

  var filesCard='<div class="card pad"><div class="rowbetween" style="margin-bottom:12px"><div class="sectitle">Files</div>'+
    '<label class="btn sm" style="cursor:pointer">'+ic("upload")+'Upload<input type="file" style="display:none" onchange="handleProfileFile(this)"></label></div>'+
    ((x.files&&x.files.length)?'<div class="profile-files">'+x.files.map(function(f,idx){
      var isImg=(f.type||"").indexOf("image/")===0;
      return '<div class="file-item">'+
        '<button class="iconbtn" style="width:26px;height:26px" onclick="removeProfileFile('+idx+')" title="Remove">'+ic("trash")+'</button>'+
        (isImg?'<img class="file-thumb" src="'+f.dataUrl+'">':'<div class="file-thumb file-thumb-ico">'+ic("doc2")+'</div>')+
        '<div class="file-name" title="'+esc(f.name)+'">'+esc(f.name)+'</div>'+
        '<div class="file-size">'+fileSize(f.size)+'</div>'+
      '</div>';
    }).join("")+'</div>':emptyMini("folder","No files attached yet."))+
  '</div>';

  return '<div class="pagehead">'+back+'</div>'+hero+infoRow+timelineCard+commCard+
    '<div class="profile-row">'+notesCard+tasksCard+'</div>'+activityCard+filesCard;
}

/* ==================================================================
   INVOICES — one premium card per client, drill into the real document
   ================================================================== */
/* shown only for the one genuine async-latency moment in this app -- the very
   first cloud fetch, before any local cache exists. Never shown for the app's
   normal synchronous localStorage renders, and never shown once there's cached
   data to display instead (a stale list beats a fake loading state). */
function skelRow(){
  return '<div class="skel-row"><div class="skel skel-ava"></div>'+
    '<div class="skel skel-line" style="width:38%"></div>'+
    '<div class="skel skel-line" style="width:16%"></div>'+
    '<div class="skel skel-line" style="width:12%"></div></div>';
}
function pgClientsSkeleton(){
  var rows="";for(var i=0;i<5;i++)rows+=skelRow();
  return '<div class="pagehead"><div class="h1">Past Clients</div><div class="sub">Syncing with the cloud…</div></div>'+
    '<div class="tbl-wrap">'+rows+'</div>';
}
function skelInvoiceCard(){
  return '<div class="card invoice-card">'+
    '<div class="skel skel-line" style="width:55%;margin-bottom:16px"></div>'+
    '<div class="skel skel-line" style="width:45%;height:26px;margin-bottom:18px"></div>'+
    '<div class="skel skel-line" style="width:75%"></div></div>';
}
function pgInvoiceListSkeleton(){
  var cards="";for(var i=0;i<4;i++)cards+=skelInvoiceCard();
  return '<div class="pagehead"><div class="h1">Invoices</div><div class="sub">Syncing with the cloud…</div></div>'+
    '<div class="invoice-grid">'+cards+'</div>';
}
function pgInvoiceList(){
  if(cloudReady())syncClients();
  if(cloudReady()&&syncing&&!db.clients.length)return pgInvoiceListSkeleton();
  var v=invoiceListView;
  var rows=db.clients.map(function(x,i){return {x:x,i:i};});
  var countAll=rows.length;
  var countUnpaid=rows.filter(function(r){return (r.x.invoice&&r.x.invoice.status)!=="PAID";}).length;
  var countPaid=countAll-countUnpaid;
  var totalOutstanding=rows.filter(function(r){return (r.x.invoice&&r.x.invoice.status)!=="PAID";})
    .reduce(function(a,r){return a+calcInvoiceTotals(r.x.invoice||{items:[]}).grand;},0);

  var head='<div class="pagehead"><div class="rowbetween"><div><div class="h1">Invoices</div>'+
    '<div class="sub">'+countAll+' invoice'+(countAll===1?"":"s")+' · '+money(totalOutstanding)+' outstanding</div></div>'+
    '<button class="btn pri sm" onclick="goPage(\'onboard\')">'+ic("plus")+'New client</button></div></div>';

  if(!countAll){
    return head+'<div class="card pad">'+emptyState("card","No invoices yet",
      "Onboard your first client and their invoice appears here automatically.",
      ic("sparkle")+"Start onboarding","goPage('onboard')")+'</div>';
  }

  if(v.filter==="unpaid")rows=rows.filter(function(r){return (r.x.invoice&&r.x.invoice.status)!=="PAID";});
  else if(v.filter==="paid")rows=rows.filter(function(r){return (r.x.invoice&&r.x.invoice.status)==="PAID";});

  var tabs='<div class="tbl-filters" style="margin-bottom:18px">'+
    invFilterTab("all","All",countAll)+invFilterTab("unpaid","Unpaid",countUnpaid)+invFilterTab("paid","Paid",countPaid)+
  '</div>';

  return head+tabs+'<div class="invoice-grid">'+rows.map(invoiceCard).join("")+'</div>';
}
function invFilterTab(key,label,count){
  return '<button class="tbl-tab'+(invoiceListView.filter===key?" on":"")+'" onclick="setInvoiceFilter(\''+key+'\')">'+esc(label)+' <span>'+count+'</span></button>';
}
function setInvoiceFilter(f){invoiceListView.filter=f;render();}
function invoiceCard(row){
  var x=row.x,i=row.i,inv=x.invoice||{items:[],status:"UNPAID"},t=calcInvoiceTotals(inv);
  var paid=inv.status==="PAID";
  return '<div class="card invoice-card">'+
    '<div class="rowbetween" style="margin-bottom:14px;align-items:flex-start">'+
      '<div style="display:flex;gap:12px;align-items:center;min-width:0">'+
        '<div class="uava" style="width:38px;height:38px;font-size:13px;flex:none">'+initials(x.company)+'</div>'+
        '<div style="min-width:0"><div style="font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(x.company)+'</div>'+
          '<div style="font-size:12px;color:var(--grey-2)">'+esc(inv.number||"—")+'</div></div>'+
      '</div>'+
      '<span class="pill '+(paid?"ok":"warn")+'"><span class="d"></span>'+(paid?"Paid":"Unpaid")+'</span>'+
    '</div>'+
    '<div class="invoice-amount">'+money(t.grand)+'</div>'+
    '<div class="invoice-meta"><span>Due '+esc(inv.due||"—")+'</span><span>'+esc(x.contact||x.name||"")+'</span></div>'+
    '<div class="invoice-actions">'+
      '<button class="iconbtn" title="Preview" onclick="loadClient('+i+');goPage(\'invoice\')">'+ic("eye")+'</button>'+
      '<button class="iconbtn" title="Download PDF" onclick="downloadInvoicePDF('+i+')">'+ic("download")+'</button>'+
      '<button class="iconbtn" title="Send via WhatsApp" onclick="sendInvoiceWA('+i+')" style="color:#25D366">'+WA_LOGO+'</button>'+
      '<button class="iconbtn" title="Duplicate" onclick="duplicateInvoice('+i+')">'+ic("copy")+'</button>'+
      (paid?"":'<button class="iconbtn" title="Mark as paid" onclick="markInvoicePaid('+i+')">'+ic("check")+'</button>')+
    '</div>'+
  '</div>';
}
function downloadInvoicePDF(i){
  loadClient(i);
  goPage("invoice");
  setTimeout(exportPDF,60);
}
function sendInvoiceWA(i){
  var x=db.clients[i];if(!x)return;
  var inv=x.invoice||{items:[]},t=calcInvoiceTotals(inv);
  var n=waNumber(x.phone);
  if(!n){toast("No phone number saved for this client");return;}
  var msg="Hi "+(x.name||x.contact||"")+"! Here's your invoice "+(inv.number||"")+" for "+money(t.grand)+", due "+(inv.due||"soon")+". Let me know if you have any questions.";
  window.open("https://wa.me/"+n+"?text="+encodeURIComponent(msg),"_blank");
}
function duplicateInvoice(i){
  var x=db.clients[i];if(!x)return;
  loadClient(i);
  var n=db.invoice.number||"INV-0001";
  var m=n.match(/(\d+)$/);
  db.invoice.number=m?n.slice(0,m.index)+String(Number(m[1])+1).padStart(m[1].length,"0"):n+"-2";
  db.invoice.status="UNPAID";db.invoice.issue="";db.invoice.due="";
  persist();
  goPage("settings");
  toast("Duplicated as "+db.invoice.number+" — set a due date and save to confirm");
}
function markInvoicePaid(i){
  var x=db.clients[i];if(!x||!x.invoice)return;
  x.invoice.status="PAID";x.status="Completed";
  logProfActivity(x,"card","Marked invoice "+(x.invoice.number||"")+" as paid");
  cloudSaveClient(x);persist();render();toast("Marked as paid");
}

function pgInvoice(){
  var t=invTotals(),inv=db.invoice,c=db.client;
  var rows=inv.items.map(function(i){var tot=(Number(i.qty)||0)*(Number(i.price)||0);
    return '<tr><td class="desc"><b>'+esc(i.desc)+'</b><span>'+esc(i.note||"")+'</span></td>'+
      '<td class="r">'+esc(i.qty)+'</td><td class="r">'+money(i.price)+'</td><td class="r">'+money(tot)+'</td></tr>';}).join("");
  var statusPill=inv.status==="PAID"?'<span class="pill ok"><span class="d"></span>Paid</span>':'<span class="pill warn"><span class="d"></span>Unpaid</span>';
  return '<div class="docwrap">'+
    '<button class="btn ghost sm no-print" style="margin-bottom:10px" onclick="goInvoiceList()">'+ic("chevronLeft")+'Back to Invoices</button>'+
    '<div class="docbar no-print"><div><div class="h1" style="font-size:22px">Invoice '+esc(inv.number)+'</div><div class="sub" style="margin-top:4px">Issued '+esc(inv.issue)+' · Due '+esc(inv.due)+'</div></div>'+
      '<div class="docbar-actions">'+
        '<button class="btn sm" onclick="goPage(\'onboard\')">'+ic("gear")+'Edit pricing</button>'+
        '<button class="btn sm" onclick="window.print()">'+ic("print")+'Print</button>'+
        '<button class="btn pri sm" onclick="exportPDF()">'+ic("download")+'Export PDF</button></div></div>'+
    '<div class="sheet" id="printSheet">'+
      '<div class="shead"><div class="logo"><img src="data:image/png;base64,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"><div><div class="n">Arcen Digital</div><div class="t">DIGITAL AGENCY</div></div></div>'+
        '<div class="doctype"><div class="big">INVOICE</div><div class="sm">'+esc(inv.number)+'</div></div></div>'+
      '<div class="sbody">'+
        '<div class="metarow">'+
          '<div class="metablock"><div class="ml">Billed to</div><div class="mv"><b>'+esc(c.company)+'</b><br>'+esc(c.contact)+'<br>'+esc(c.email)+'<br>'+esc(c.phone)+'<br>'+esc(c.address)+'</div></div>'+
          '<div class="metablock" style="text-align:right"><div class="ml">Issue date</div><div class="mv"><b>'+esc(inv.issue)+'</b></div>'+
            '<div class="ml" style="margin-top:12px">Due date</div><div class="mv"><b>'+esc(inv.due)+'</b></div>'+
            '<div class="ml" style="margin-top:12px">Status</div><div class="mv" style="margin-top:2px">'+statusPill+'</div></div>'+
        '</div>'+
        '<table class="itable"><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>'+rows+'</tbody></table>'+
        '<div class="totals">'+
          '<div class="tr"><span>Subtotal</span><span>'+money(t.sub)+'</span></div>'+
          '<div class="tr"><span>VAT ('+inv.vat+'%)</span><span>'+money(t.vat)+'</span></div>'+
          (t.disc?'<div class="tr"><span>Discount</span><span>−'+money(t.disc)+'</span></div>':'')+
          '<div class="tr grand"><span>Total due</span><span>'+money(t.grand)+'</span></div>'+
        '</div>'+
        '<div class="paybox">'+
          '<div><div class="pl">Payment details</div><div class="pv"><b>'+esc(inv.bank.name)+'</b><br>'+esc(inv.bank.bankName)+'<br>Acc: '+esc(inv.bank.acc)+'<br>Branch: '+esc(inv.bank.branch)+'</div></div>'+
          '<div><div class="pl">Reference</div><div class="pv"><b>'+esc(inv.number)+'</b></div>'+
            '<div class="pl" style="margin-top:12px">Terms</div><div class="pv">Payment due within 7 days.</div></div>'+
        '</div>'+
      '</div>'+
      '<div class="sfoot"><span>Thank you for choosing Arcen Digital.</span><span>support@arcendigital.co.za</span></div>'+
    '</div></div>';
}

function pgAgreement(){
  var a=db.agreement,c=db.client,p=db.project;
  var scope=["Custom Website Design","Development & Build","Mobile Responsive Layout","Basic SEO Setup","Contact Forms","Hosting Configuration","Analytics Setup","Client Handover & Training"];
  var resp=["Logo & brand assets","Written content","Product / service photography","Timely feedback","Design approvals","Access credentials"];
  var clauses=[
    ["Scope of work",'<p>Arcen Digital will design and develop '+esc(p.name.toLowerCase())+' for '+esc(c.company)+'. The engagement covers the following deliverables:</p><ul class="chk">'+scope.map(function(s){return '<li>'+esc(s)+'</li>';}).join("")+'</ul>'],
    ["Timeline",'<p>The estimated completion date is <b>'+esc(p.estCompletion)+'</b>, from receipt of deposit and all required content. Timelines shift if content or approvals are delayed by the client.</p>'],
    ["Client responsibilities",'<p>To keep the project on schedule, the client agrees to provide:</p><ul class="chk">'+resp.map(function(s){return '<li>'+esc(s)+'</li>';}).join("")+'</ul>'],
    ["Payment terms",'<p>A <b>'+a.deposit+'% deposit</b> ('+money(projectTotal()*a.deposit/100)+') is payable before work begins. The remaining <b>'+a.balance+'%</b> ('+money(projectTotal()*a.balance/100)+') is due before launch. Late payments accrue interest at 2% per month. Deposits are non-refundable once work has commenced.</p>'],
    ["Revision policy",'<p>This engagement includes <b>'+a.revisions+' rounds of revisions</b>. Additional revisions are billed at the agency'+"'"+'s standard hourly rate.</p>'],
    ["Ownership",'<p>Full ownership of the final website and its assets transfers to the client upon receipt of final payment. Arcen Digital retains the right to display the work in its portfolio.</p>'],
    ["Warranty",'<p>Arcen Digital provides <b>30 days</b> of complimentary bug fixing after launch. This covers defects, not new features or content changes.</p>'],
    ["Confidentiality",'<p>Both parties agree to keep all shared business information, credentials and materials strictly confidential.</p>'],
    ["Termination",'<p>Either party may terminate this agreement with written notice. The client remains liable for all work completed up to the termination date.</p>'],
    ["Liability",'<p>Arcen Digital'+"'"+'s total liability is limited to the total fees paid under this agreement. The agency is not liable for indirect or consequential losses.</p>']
  ];
  return '<div class="docwrap">'+
    '<div class="docbar no-print"><div><div class="h1" style="font-size:22px">Service Agreement</div><div class="sub" style="margin-top:4px">'+esc(a.number)+' · '+esc(a.date)+'</div></div>'+
      '<div class="docbar-actions">'+
        (a.signed?'<span class="pill ok"><span class="d"></span>Signed '+esc(a.signedDate)+'</span>':
          '<button class="btn sm" onclick="markSigned()">'+ic("check")+'Mark as signed</button>')+
        '<button class="btn sm" onclick="window.print()">'+ic("print")+'Print</button>'+
        '<button class="btn pri sm" onclick="exportPDF()">'+ic("download")+'Export PDF</button></div></div>'+
    '<div class="sheet" id="printSheet">'+
      '<div class="shead"><div class="logo"><img src="data:image/png;base64,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"><div><div class="n">Arcen Digital</div><div class="t">DIGITAL AGENCY</div></div></div>'+
        '<div class="doctype"><div class="big">AGREEMENT</div><div class="sm">'+esc(a.number)+'</div></div></div>'+
      '<div class="sbody">'+
        '<div class="metarow">'+
          '<div class="metablock"><div class="ml">Between</div><div class="mv"><b>Arcen Digital</b><br>The Agency</div></div>'+
          '<div class="metablock"><div class="ml">And</div><div class="mv"><b>'+esc(c.company)+'</b><br>'+esc(c.contact)+'<br>The Client</div></div>'+
          '<div class="metablock" style="text-align:right"><div class="ml">Date</div><div class="mv"><b>'+esc(a.date)+'</b></div>'+
            '<div class="ml" style="margin-top:12px">Services</div><div class="mv">Website Design & Basic SEO</div></div>'+
        '</div>'+
        clauses.map(function(cl,i){return '<div class="clause"><h3><span class="no">'+(i+1<10?"0":"")+(i+1)+'</span>'+esc(cl[0])+'</h3>'+cl[1]+'</div>';}).join("")+
        '<div class="sigrow"><div class="sig"><div class="line"></div><div class="cap">Client · '+esc(c.contact)+'</div></div>'+
          '<div class="sig"><div class="line"></div><div class="cap">Arcen Digital</div></div>'+
          '<div class="sig" style="max-width:130px"><div class="line"></div><div class="cap">Date</div></div></div>'+
      '</div>'+
      '<div class="sfoot"><span>Arcen Digital · arcendigital.co.za</span><span>'+esc(a.number)+'</span></div>'+
    '</div></div>';
}

function markSigned(){
  if(!confirm("Mark this agreement as signed by "+(db.client.company||db.client.name)+"?"))return;
  db.agreement.signed=true;
  db.agreement.signedDate=new Date().toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});
  logActivity("check","Agreement signed by "+(db.client.company||db.client.name));
  persist();render();toast("Agreement marked as signed");
}

function nowTime(){return new Date().toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"});}

/* Settings used to be one long scroll of 5 stacked cards -- every field
   still lives in the DOM at all times (saveSettings() reads them all
   regardless of which tab is showing), only *visibility* is toggled, so
   switching tabs can never silently lose an unsaved edit on another tab. */
var settingsTab="client";
var SETTINGS_TABS=[["client","Client & Project"],["invoice","Invoice"],["agreement","Agreement"],["account","Account"]];
function setSettingsTab(tab){
  settingsTab=tab;
  document.querySelectorAll(".settings-panel").forEach(function(p){
    p.style.display=(p.getAttribute("data-tab")===tab)?"block":"none";
  });
  document.querySelectorAll(".settings-tabnav .tbl-tab").forEach(function(b){
    b.classList.toggle("on",b.getAttribute("data-tab")===tab);
  });
}
function pgSettings(){
  var c=db.client,p=db.project,inv=db.invoice,a=db.agreement;
  var acct;
  if(!CLOUD_ON){
    acct='<div class="sub" style="font-size:12.5px">Cloud sync is not configured. Paste your Supabase publishable key at the top of <b>app.js</b> (marked PASTE_YOUR_PUBLISHABLE_KEY_HERE) and redeploy — then the client list is shared across your whole team.</div>';
  }else{
    acct='<div class="rowbetween" style="flex-wrap:wrap;gap:10px"><div><div style="font-size:13.5px;font-weight:600">Cloud sync active</div>'+
      '<div class="sub" style="font-size:12px;margin-top:3px">Past Clients sync to the shared team database automatically.</div></div>'+
      '<button class="btn sm" onclick="syncClients(true);toast(\'Syncing…\')">'+ic("upload")+'Sync now</button></div>';
  }
  var tabnav='<div class="settings-tabnav">'+SETTINGS_TABS.map(function(t){
    return '<button class="tbl-tab'+(settingsTab===t[0]?" on":"")+'" data-tab="'+t[0]+'" onclick="setSettingsTab(\''+t[0]+'\')">'+esc(t[1])+'</button>';
  }).join("")+'</div>';
  function panel(tab,html){return '<div class="settings-panel" data-tab="'+tab+'" style="display:'+(settingsTab===tab?"block":"none")+'">'+html+'</div>';}

  var clientPanel=panel("client",
    '<div class="card pad" style="margin-bottom:16px"><div class="sectitle" style="margin-bottom:16px">Client</div>'+
      '<div class="setgrid">'+
        setField("s_name","Display name",c.name)+setField("s_company","Company",c.company)+
        setField("s_contact","Contact person",c.contact)+setField("s_email","Email",c.email)+
        setField("s_phone","Phone",c.phone)+setField("s_address","Address",c.address)+
      '</div></div>'+
    '<div class="card pad"><div class="sectitle" style="margin-bottom:16px">Project</div>'+
      '<div class="setgrid">'+
        setField("s_pname","Project name",p.name)+setField("s_status","Status",p.status)+
        setField("s_est","Est. completion",p.estCompletion)+
      '</div>'+
      '<div class="f full" style="margin-top:16px"><textarea id="s_obj" placeholder=" ">'+esc(p.objective)+'</textarea><label>Objective</label></div></div>');

  var invoicePanel=panel("invoice",
    '<div class="card pad"><div class="sectitle" style="margin-bottom:16px">Your agency &amp; invoice details</div>'+
      '<div class="setgrid">'+
        setField("s_bizname","Business name (shown on invoice)",inv.bank.name)+setField("s_invno","Invoice number",inv.number)+
        setField("s_invstatus","Status (PAID / UNPAID)",inv.status)+
        setField("s_bank","Bank name",inv.bank.bankName)+setField("s_acc","Account number",inv.bank.acc)+
        setField("s_branch","Branch code",inv.bank.branch)+setField("s_vat","VAT %",inv.vat,"number")+
        setField("s_disc","Discount (R)",inv.discount,"number")+setField("s_due","Due date",inv.due)+
      '</div>'+
      '<div class="cardlabel" style="margin:18px 0 10px">Line items — edit prices here and the invoice updates on save</div>'+
      '<div id="lineItems">'+inv.items.map(lineItemRow).join("")+'</div>'+
      '<button class="btn sm" style="margin-top:10px" onclick="addLineItem()">'+ic("plus")+'Add line item</button>'+
    '</div>');

  var agreementPanel=panel("agreement",
    '<div class="card pad"><div class="sectitle" style="margin-bottom:16px">Agreement</div>'+
      '<div class="setgrid">'+
        setField("s_agrno","Agreement number",a.number)+setField("s_rev","Revision rounds",a.revisions,"number")+
        setField("s_dep","Deposit %",a.deposit,"number")+setField("s_bal","Balance %",a.balance,"number")+
      '</div></div>');

  var accountPanel=panel("account",
    '<div class="card pad"><div class="sectitle" style="margin-bottom:14px">Team account</div>'+acct+'</div>');

  return '<div class="pagehead"><div class="h1">Settings</div><div class="sub">Edit your agency\'s info and this project\'s details — everything here updates the invoice, agreement and documents automatically.</div></div>'+
    tabnav+clientPanel+invoicePanel+agreementPanel+accountPanel+
    '<div class="floatbar"><button class="btn" onclick="resetAll()">'+ic("trash")+'Reset portal (clear all clients &amp; data)</button>'+
      '<button class="btn pri" onclick="saveSettings()">'+ic("check")+'Save changes</button></div>';
}
function setField(id,label,val,type,hint){
  return '<div class="f"><input id="'+id+'" type="'+(type||"text")+'" value="'+esc(val)+'" placeholder=" " oninput="clearFieldErr(this)"><label for="'+id+'">'+label+'</label>'+
    (hint?'<div class="f-hint">'+hint+'</div>':'')+'<div class="f-err" id="'+id+'_err"></div></div>';
}
function clearFieldErr(input){
  var f=input.closest(".f");if(!f)return;f.classList.remove("err");
  var e=f.querySelector(".f-err");if(e)e.textContent="";
}
function lineItemRow(i,idx){
  return '<div class="lirow">'+
    '<div class="f compact"><input class="li-desc" placeholder="Description" value="'+esc(i.desc)+'"></div>'+
    '<div class="f compact"><input class="li-note" placeholder="Note (optional)" value="'+esc(i.note||"")+'"></div>'+
    '<div class="f compact"><input class="li-qty" type="number" min="1" value="'+esc(i.qty)+'"></div>'+
    '<div class="f compact"><input class="li-price" type="number" min="0" placeholder="Price (R)" value="'+esc(i.price)+'"></div>'+
    '<button class="iconbtn" style="width:34px;height:34px" title="Remove" onclick="this.parentNode.remove()">'+ic("trash")+'</button></div>';
}
function addLineItem(){
  var wrap=el("lineItems");if(!wrap)return;
  var d=document.createElement("div");
  d.innerHTML=lineItemRow({desc:"",note:"",qty:1,price:0});
  wrap.appendChild(d.firstChild);
}
function readLineItems(){
  var rows=document.querySelectorAll("#lineItems .lirow");var out=[];
  rows.forEach(function(r){
    var q=function(cls){var e=r.querySelector(cls);return e?e.value:"";};
    var desc=q(".li-desc").trim();if(!desc)return;
    out.push({desc:desc,note:q(".li-note").trim(),qty:Math.max(1,parseInt(q(".li-qty"))||1),price:parseFloat(q(".li-price"))||0});
  });
  return out;
}
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
function resetAll(){if(!confirm("Clear everything and start fresh? This removes all saved clients, the current invoice, agreement and messages on this device. This cannot be undone."))return;db=clone(DEFAULT);persist();bootUI();toast("Portal reset — clean slate");}

/* ---------- PDF export (real .pdf download via html2pdf) ---------- */
function exportPDF(){
  var sheet=el("printSheet");
  if(!sheet){toast("Nothing to export on this page");return;}
  if(typeof html2pdf==="undefined"){
    toast("PDF library unavailable — opening print dialog instead");
    setTimeout(function(){window.print();},300);return;
  }
  var name=(current==="agreement"?db.agreement.number:db.invoice.number)||"document";
  var fname="Arcen-"+(current==="agreement"?"Agreement":"Invoice")+"-"+String(name).replace(/[^\w-]/g,"")+".pdf";
  toast("Generating "+fname+" …");
  html2pdf().set({
    margin:[8,8,8,8],
    filename:fname,
    image:{type:"jpeg",quality:0.97},
    html2canvas:{scale:2,useCORS:true,backgroundColor:"#ffffff"},
    jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},
    pagebreak:{mode:["avoid-all","css","legacy"],avoid:[".clause",".metarow",".totals",".paybox",".sigrow"]}
  }).from(sheet).save().then(function(){toast("PDF downloaded")})
    .catch(function(){toast("PDF failed — using print dialog");window.print();});
}

/* ---------- theme / toast ---------- */
function applyTheme(){document.documentElement.setAttribute("data-theme",db.theme);
  el("themeIco").innerHTML=db.theme==="dark"?ICONS.sun||'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>':'<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/>';}
function toggleTheme(){db.theme=db.theme==="dark"?"light":"dark";persist();applyTheme();}
function applySidebar(){document.querySelector(".app").classList.toggle("sidebar-collapsed",!!db.sidebarCollapsed);}
/* below 900px the same topbar button opens/closes a slide-in drawer instead of
   toggling the desktop rail -- mobileNavOpen is deliberately not persisted, it's
   a transient UI state, not a saved preference like sidebarCollapsed */
var mobileNavOpen=false;
function applyMobileNav(){document.querySelector(".app").classList.toggle("nav-open",mobileNavOpen);}
function closeMobileNav(){if(mobileNavOpen){mobileNavOpen=false;applyMobileNav();}}
function toggleSidebar(){
  if(window.innerWidth<=900){mobileNavOpen=!mobileNavOpen;applyMobileNav();return;}
  db.sidebarCollapsed=!db.sidebarCollapsed;persist();applySidebar();
}

function toast(msg){
  var wrap=el("toasts");var t=document.createElement("div");t.className="toast";
  t.innerHTML='<span class="ti">'+ic("check")+'</span>'+esc(msg);
  wrap.appendChild(t);
  var reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(function(){
    t.style.transition=reduced?"opacity .2s":"opacity .3s,transform .3s";
    t.style.opacity="0";if(!reduced)t.style.transform="translateX(20px)";
    setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},reduced?210:320);
  },2600);
}

/* ---------- search ---------- */
/* ==================================================================
   GLOBAL SEARCH — instant, cross-entity (clients, projects, invoices,
   files, messages, tasks), all results resolve to one place: the
   matching client's Profile page, which already shows all of it.
   ================================================================== */
function truncate(s,n){s=String(s||"");return s.length>n?s.slice(0,n).trim()+"…":s;}
function matchAny(q,arr){return arr.some(function(s){return s&&String(s).toLowerCase().indexOf(q)>=0;});}
function hiMatch(text,q){
  text=String(text||"");
  var idx=text.toLowerCase().indexOf(q.toLowerCase());
  if(idx<0)return esc(text);
  return esc(text.slice(0,idx))+"<mark>"+esc(text.slice(idx,idx+q.length))+"</mark>"+esc(text.slice(idx+q.length));
}
function searchIndex(rawQ){
  var q=rawQ.trim().toLowerCase();
  if(!q)return [];
  var out=[];
  function hit(cat,icon,title,sub,idx){out.push({cat:cat,icon:icon,title:title,sub:sub,idx:idx});}
  db.clients.forEach(function(x,i){
    var pi=x.projectInfo||{},inv=x.invoice||{items:[]};
    if(matchAny(q,[x.company,x.contact,x.name,x.email,x.phone,x.address]))
      hit("Client","building",x.company,x.contact||x.name||"",i);
    if(pi.name&&matchAny(q,[pi.name,pi.objective,pi.status]))
      hit("Project","target",pi.name,"Project for "+x.company,i);
    var invHay=[inv.number].concat((inv.items||[]).map(function(it){return it.desc+" "+(it.note||"");}));
    if(matchAny(q,invHay))
      hit("Invoice","card",inv.number||"Invoice",x.company+" · "+money(calcInvoiceTotals(inv).grand),i);
    (x.files||[]).forEach(function(f){if(matchAny(q,[f.name]))hit("File","doc2",f.name,"File for "+x.company,i);});
    (x.messages||[]).forEach(function(m){if(matchAny(q,[m.text]))hit("Message","chat",truncate(m.text,60),x.company,i);});
    (x.tasks||[]).forEach(function(t){if(matchAny(q,[t.text]))hit("Task","clipboard",t.text,"Task for "+x.company,i);});
  });
  return out;
}
function renderSearchResults(rawQ){
  var panel=el("searchResults");if(!panel)return;
  var results=searchIndex(rawQ);
  if(!results.length){
    panel.innerHTML='<div class="sr-empty">No results for "'+esc(rawQ.trim())+'"</div>';
    panel.classList.add("show");positionSearchPanel();return;
  }
  var q=rawQ.trim(),grouped={},order=[];
  results.forEach(function(r){
    if(!grouped[r.cat]){grouped[r.cat]=[];order.push(r.cat);}
    if(grouped[r.cat].length<4)grouped[r.cat].push(r);
  });
  panel.innerHTML=order.map(function(cat){
    return '<div class="sr-group"><div class="sr-group-label">'+esc(cat)+'</div>'+
      grouped[cat].map(function(r){
        return '<div class="sr-item" onclick="goSearchResult('+r.idx+')"'+KBD_ACT+'>'+
          '<div class="sr-ico">'+ic(r.icon)+'</div>'+
          '<div style="flex:1;min-width:0"><div class="sr-title">'+hiMatch(r.title,q)+'</div>'+
          '<div class="sr-sub">'+esc(r.sub)+'</div></div></div>';
      }).join("")+
    '</div>';
  }).join("");
  panel.classList.add("show");positionSearchPanel();
}
function positionSearchPanel(){
  var input=el("search"),panel=el("searchResults");
  if(!input||!panel)return;
  var r=input.getBoundingClientRect();
  panel.style.top=(r.bottom+8)+"px";
  panel.style.left=r.left+"px";
  panel.style.width=Math.max(320,r.width+40)+"px";
}
function closeSearchResults(){var p=el("searchResults");if(p)p.classList.remove("show");}
function goSearchResult(i){
  closeSearchResults();
  var s=el("search");if(s)s.value="";
  openProfile(i);
}
function initSearch(){
  var s=el("search");if(!s)return;
  s.addEventListener("input",function(){
    if(!s.value.trim()){closeSearchResults();return;}
    renderSearchResults(s.value);
  });
  s.addEventListener("focus",function(){if(s.value.trim())renderSearchResults(s.value);});
  s.addEventListener("keydown",function(e){
    if(e.key==="Enter"){var first=document.querySelector(".sr-item");if(first)first.click();}
    else if(e.key==="Escape"){closeSearchResults();s.blur();}
  });
  document.addEventListener("click",function(e){
    if(!e.target.closest(".search")&&!e.target.closest("#searchResults"))closeSearchResults();
  });
  window.addEventListener("resize",function(){if(el("searchResults").classList.contains("show"))positionSearchPanel();});
}

/* ---------- boot ---------- */
function bootUI(){
  setHeaderIdentity();
  applyTheme();applySidebar();buildNav();render();
}
function setHeaderIdentity(){
  var c=db.client;
  el("uname").textContent=c.name||"New client";
  el("ucomp").textContent=c.company||"No client loaded";
  el("uava").textContent=c.name?initials(c.name):"+";
}
function boot(){restore();bootUI();initSearch();initCloud();}

/* ==================================================================
   CLOUD SYNC — shared client book via Supabase
   Local storage stays as the offline cache; the portal_clients
   table is the shared source of truth for the Past Clients list.
   ================================================================== */
var supa=null,CLOUD_ON=false,syncing=false,lastSync=0;

function initCloud(){
  if(!window.supabase||!SUPA_URL||!SUPA_KEY||SUPA_KEY.indexOf("PASTE")===0){setCloudState("local");return;}
  try{supa=window.supabase.createClient(SUPA_URL,SUPA_KEY);}catch(e){setCloudState("local");return;}
  CLOUD_ON=true;
  syncClients(true);
}

/* ---- status chip ---- */
function setCloudState(state){
  var chip=el("cloudchip"),txt=el("cloudchiptext");
  if(!chip||!txt)return;
  var map={
    local:   ["","Local only",false],
    syncing: ["acc","Syncing…",true],
    synced:  ["ok","Cloud synced",true],
    offline: ["warn","Offline — saved locally",true]
  };
  var m=map[state]||map.local;
  chip.className="pill "+m[0];
  txt.textContent=m[1];
  chip.style.display=m[2]||state==="local"?"inline-flex":"none";
  chip.setAttribute("data-state",state);
}
function cloudChipClick(){
  var s=el("cloudchip").getAttribute("data-state");
  if(s==="synced"||s==="offline")syncClients(true);
  else if(s==="local")toast("Cloud not set up yet — paste your Supabase key at the top of app.js");
}

/* ---- row <-> local mapping ---- */
function rowToClient(r){
  return {id:r.id,company:r.company,contact:r.contact||"",name:r.name||"",phone:r.phone||"",
    email:r.email||"",address:r.address||"",project:r.project||"",value:Number(r.value)||0,
    status:r.status||"Active",date:fmtDate(r.onboarded_on)};
}
function clientToRow(c){
  return {company:c.company,contact:c.contact||"",name:c.name||"",phone:c.phone||"",
    email:c.email||"",address:c.address||"",project:c.project||"",value:Number(c.value)||0,
    status:c.status||"Active"};
}
function fmtDate(d){
  if(!d)return "";
  var dt=new Date(String(d).slice(0,10)+"T00:00:00");
  if(isNaN(dt))return String(d);
  return dt.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});
}

/* ---- sync engine ---- */
function cloudReady(){return CLOUD_ON&&!!supa;}
/* re-render after a background cloud round-trip completes -- but never while the
   user has an unsaved draft focused (Onboarding/Settings fields and the Profile's
   note/task/message composers don't mirror to state until an explicit save/add,
   so a full re-render mid-keystroke would silently wipe what they just typed) */
function safeRefresh(){
  var a=document.activeElement;
  if(a&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"))return;
  render();
}
function syncClients(force){
  if(!cloudReady()||syncing)return;
  if(!force&&Date.now()-lastSync<15000)return;
  syncing=true;setCloudState("syncing");
  /* 1. push anything new or changed locally */
  var pending=db.clients.filter(function(x){return !x.id||x._dirty;}).map(clientToRow);
  var push=pending.length
    ?supa.from("portal_clients").upsert(pending,{onConflict:"company"})
    :Promise.resolve({error:null});
  Promise.resolve(push).then(function(r){
    if(r&&r.error)throw r.error;
    /* 2. pull everything — cloud is source of truth */
    return supa.from("portal_clients").select("*").order("created_at",{ascending:false});
  }).then(function(r){
    if(r.error)throw r.error;
    /* cloud is the source of truth for the lightweight summary fields, but the rich
       per-client extras (photo/timeline/notes/tasks/files/messages/documents) are
       local-only and would otherwise be wiped out by this overwrite -- preserve them
       by matching on company name (the same key the upsert/onConflict uses) */
    var byCompany={};
    db.clients.forEach(function(x){byCompany[x.company.toLowerCase()]=x;});
    db.clients=(r.data||[]).map(function(row){
      var fresh=rowToClient(row);
      var prev=byCompany[fresh.company.toLowerCase()];
      applyClientMeta(fresh,prev);
      applyClientSnapshot(fresh,prev);
      return fresh;
    });
    persist();lastSync=Date.now();syncing=false;
    setCloudState("synced");
    /* several pages (Dashboard, Invoices, Client Profile) all read db.clients too,
       not just Past Clients -- refresh whichever one is actually on screen */
    safeRefresh();
  }).catch(function(e){
    syncing=false;setCloudState("offline");
    console.warn("sync failed",e&&e.message);
  });
}
function cloudSaveClient(rec){
  if(!cloudReady()){rec._dirty=true;persist();return;}
  supa.from("portal_clients").upsert(clientToRow(rec),{onConflict:"company"}).select().single()
    .then(function(r){
      if(r.error)throw r.error;
      rec.id=r.data.id;rec.date=fmtDate(r.data.onboarded_on);delete rec._dirty;
      persist();setCloudState("synced");
      safeRefresh();
    }).catch(function(){rec._dirty=true;persist();setCloudState("offline");toast("Offline — saved on this device, will sync later");});
}
function cloudDeleteClient(rec){
  if(!rec.id||!cloudReady())return;
  supa.from("portal_clients").delete().eq("id",rec.id)
    .then(function(r){if(r.error)throw r.error;})
    .catch(function(){toast("Couldn't remove from cloud — it may come back on next sync");});
}
boot();
