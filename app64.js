/* Active status: "🟢 نشط الآن" / "آخر ظهور ..." at the top of a private chat (friends only), heartbeat while the app is open, switch in Settings. */
(function(){
const UID=()=>(cs()||{}).uid;
let mineShow=null,last=0,cache={};
async function beat(){
  if(!cs()||document.hidden||Date.now()-last<50000)return;last=Date.now();
  try{await sb("/rest/v1/user_presence?on_conflict=user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{user_id:UID(),last_seen:new Date().toISOString()}});
    if(mineShow===null){const r=await sb("/rest/v1/user_presence?select=show_status&user_id=eq."+UID())||[];mineShow=r[0]?r[0].show_status!==false:true}}catch(e){}
}
setInterval(beat,60000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)beat()});setTimeout(beat,4000);
const ago=iso=>{const s=Math.max(0,(Date.now()-new Date(iso))/1000);
  if(s<150)return"🟢 نشط الآن";if(s<3600)return"آخر ظهور من "+an(Math.round(s/60))+" دقيقة";if(s<86400)return"آخر ظهور من "+an(Math.round(s/3600))+" ساعة";return"آخر ظهور من "+an(Math.round(s/86400))+" يوم"};
window.presText=ago;
async function show(){
  const d=curDm();if(!d||!d.pid||!UUID_RE.test(d.pid)||!cs())return;
  const box=document.getElementById("dmsgs");if(!box)return;
  let el=document.getElementById("dmPres");
  if(!el){el=document.createElement("div");el.id="dmPres";el.className="muted";el.style.cssText="padding:4px 12px;font-size:13px;text-align:center";box.parentNode.insertBefore(el,box)}
  const c=cache[d.pid];
  if(c&&Date.now()-c.t<30000){el.textContent=c.txt;return}
  try{const r=await sb("/rest/v1/user_presence?select=last_seen&user_id=eq."+d.pid)||[];
    if(mineShow===null){const m=await sb("/rest/v1/user_presence?select=show_status&user_id=eq."+UID())||[];mineShow=m[0]?m[0].show_status!==false:true}
    const txt=(r[0]&&mineShow)?ago(r[0].last_seen):"";cache[d.pid]={t:Date.now(),txt};el.textContent=txt}catch(e){}
}
let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(show,250)}).observe(document.documentElement,{childList:true,subtree:true});
setInterval(show,30000);
const oldS=PAGES.settings&&PAGES.settings.render;
if(oldS)PAGES.settings.render=function(){const h=oldS();if(!cs())return h;
  if(mineShow===null)setTimeout(async()=>{try{const m=await sb("/rest/v1/user_presence?select=show_status&user_id=eq."+UID())||[];mineShow=m[0]?m[0].show_status!==false:true;if(curPage()==="settings")renderPage()}catch(e){}},0);
  const on=mineShow!==false;
  return h+'<div class="card"><b>🟢 حالة النشاط</b><p class="muted">أصدقاءك يشوفوا إنك نشط أو آخر ظهور. لو قفلتها مش هتشوف حالة حد برضه.</p><button class="chip'+(on?" on":"")+'" onclick="presToggle()">'+(on?"✅ مفعّلة":"⛔ مقفولة")+'</button></div>'};
window.presToggle=async function(){
  const nv=!(mineShow!==false);
  try{await sb("/rest/v1/user_presence?on_conflict=user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{user_id:UID(),show_status:nv,last_seen:new Date().toISOString()}});mineShow=nv;cache={};msg(nv?"حالة النشاط اتفعّلت":"حالة النشاط اتقفلت");renderPage()}catch(e){msg(sbErr(e).slice(0,90))}};
})();
