/* Phase 4C: notifications center (bell + badge + list). Rows are created by database triggers. */
cl.nlist=null;cl.nunread=0;
const NK={reaction:"👍",comment:"💬",reply:"↩️",comment_like:"❤️",follow:"➕",mention:"@",group_post:"👥",join_request:"🙋",service_request:"🛠️"};
function nSetBadge(n){
  cl.nunread=n;
  document.querySelectorAll(".nbadge").forEach(b=>{b.textContent=n>99?"99+":an(n);b.style.display=n?"":"none"});
  try{if(navigator.setAppBadge){n?navigator.setAppBadge(n):navigator.clearAppBadge()}}catch(e){}
}
async function nPoll(){
  const u=cs();if(!u||document.hidden||!navigator.onLine)return;
  try{
    const r=await sb("/rest/v1/notifications?select=id&read=eq.false&limit=100");
    const n=(r||[]).length,prev=cl.nunread;nSetBadge(n);
    if(n>prev&&"notif"!==curPage()&&prev>=0&&cl.nSeen){msg("🔔 عندك إشعار جديد")}
    cl.nSeen=!0;
    if("notif"===curPage())nLoad();
  }catch(e){}
}
async function nLoad(){
  try{
    const r=await sb("/rest/v1/notifications?select=*&order=created_at.desc&limit=60");
    await loadPeople((r||[]).map(x=>x.actor_id).filter(Boolean));
    cl.nlist=r||[];
    const b=document.querySelector("#page .pbody");if(b&&"notif"===curPage())b.innerHTML=PAGES.notif.render();
  }catch(e){cl.nlist=cl.nlist||[];cl.nerr=sbErr(e)}
}
PAGES.notif={title:()=>"🔔 الإشعارات",act:()=>cs()?'<button class="pact" onclick="nReadAll()">✓ قراءة الكل</button>':"",render:()=>{
  if(!cs())return authCard();
  if(cl.nlist===null)return '<p class="muted">جاري التحميل…</p>';
  if(!cl.nlist.length)return '<div class="card empty"><div style="font-size:34px">🔔</div><b>لا توجد إشعارات بعد</b><p class="muted">هتظهر هنا التفاعلات والتعليقات والردود والمتابعين والمنشورات الجديدة في جروباتك.</p></div>';
  return '<div class="nlist">'+cl.nlist.map(n=>{const a=cl.pp[n.actor_id]||{id:n.actor_id||"",name:""};return '<button class="nrow'+(n.read?"":" unr")+'" onclick="nOpen('+n.id+')">'+avHtml(a,42)+'<span class="nb"><b>'+esc(a.name||"مستخدم")+'</b> '+esc(n.text)+'<small>'+(NK[n.kind]||"🔔")+' '+agoAr(n.created_at)+'</small></span>'+(n.read?"":'<i class="ndot"></i>')+'</button>'}).join("")+'</div><button class="secondary" style="margin-top:10px" onclick="nClear()">🗑 مسح كل الإشعارات</button>';
},after:()=>{if(cs()&&(cl.nlist===null||Date.now()-(cl.nTs||0)>8000)){cl.nTs=Date.now();nLoad()}}};
async function nOpen(id){
  const n=(cl.nlist||[]).find(x=>x.id===id);if(!n)return;
  if(!n.read){n.read=!0;nSetBadge(Math.max(0,cl.nunread-1));try{await sb("/rest/v1/notifications?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{read:!0}})}catch(e){}}
  const k=n.kind,r=n.ref_id;
  if(k==="follow"&&UUID_RE.test(r||""))return openUser(r);
  if((k==="group_post"||k==="join_request"||k==="mention")&&UUID_RE.test(r||"")&&(cl.groups||[]).some(g=>g.id===r))return openGroup(r,"posts");
  if(k==="service_request")return openPage("svcs");
  backBtn();go("home");
  if(UUID_RE.test(r||"")){setTimeout(()=>{const p=document.querySelector('.fpost[data-id="'+r+'"]');p&&p.scrollIntoView({behavior:"smooth",block:"center"})},700)}
}
async function nReadAll(){
  const u=cs();if(!u)return;
  (cl.nlist||[]).forEach(n=>n.read=!0);nSetBadge(0);renderPage();
  try{await sb("/rest/v1/notifications?read=eq.false",{method:"PATCH",prefer:"return=minimal",body:{read:!0}})}catch(e){msg(sbErr(e).slice(0,80))}
}
async function nClear(){
  if(!confirm("مسح كل الإشعارات؟"))return;
  try{await sb("/rest/v1/notifications?user_id=eq."+cs().uid,{method:"DELETE",prefer:"return=minimal"});cl.nlist=[];nSetBadge(0);renderPage()}catch(e){msg(sbErr(e).slice(0,80))}
}
/* bell on home + hub tile */
try{if(Array.isArray(HUB)&&!HUB.some(h=>h[0]==="notif"))HUB.unshift(["notif","🔔","الإشعارات"])}catch(e){}
(function(){
  const fh=window.feedHome;
  window.feedHome=function(){
    const h=fh.apply(this,arguments);
    if(!cs())return h;
    const bell='<div class="nbar"><button class="nbell" aria-label="الإشعارات" onclick="openPage(\'notif\')">🔔<i class="nbadge" style="display:'+(cl.nunread?"":"none")+'">'+(cl.nunread>99?"99+":an(cl.nunread))+'</i></button></div>';
    return bell+h;
  };
  setInterval(nPoll,30000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)nPoll()});
  setTimeout(nPoll,2500);
  window.addEventListener("yomak-unread",()=>{});
  const s=document.createElement("style");
  s.textContent=".nbar{display:flex;justify-content:flex-end;margin-bottom:4px}.nbell{position:relative;border:0;background:#fff;border:1px solid var(--line,#ddd);border-radius:50%;width:42px;height:42px;font-size:20px}.nbadge{position:absolute;top:-4px;inset-inline-start:-4px;background:#d32f2f;color:#fff;border-radius:10px;font-style:normal;font-size:11px;padding:1px 6px}.nlist{display:flex;flex-direction:column;gap:4px}.nrow{display:flex;align-items:center;gap:10px;text-align:start;border:0;background:#fff;border-radius:12px;padding:10px;font:inherit}.nrow.unr{background:#eaf5ef}.nb{flex:1;min-width:0;display:flex;flex-direction:column}.nb small{color:var(--muted)}.ndot{width:10px;height:10px;border-radius:50%;background:#1e90ff}";
  document.head.appendChild(s);
})();
