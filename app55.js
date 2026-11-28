/* Version badge + "new version" banner + force update (clears caches, unregisters the service worker, reloads). Bump BUILD and version.json together on each release. */
(function(){
const BUILD="87";window.YOMAK_BUILD=BUILD;
const css=document.createElement("style");
css.textContent='#vbadge{z-index:99999!important;position:fixed;left:6px;bottom:calc(env(safe-area-inset-bottom) + 66px);z-index:9990;background:#0009;color:#fff;font-size:11px;padding:3px 8px;border-radius:12px;direction:ltr;opacity:.65}#vban{position:fixed;left:8px;right:8px;top:max(8px,env(safe-area-inset-top));z-index:99999;background:#155b50;color:#fff;border-radius:14px;padding:12px;display:flex;gap:10px;align-items:center;justify-content:space-between;box-shadow:0 6px 24px #0006}#vban button{border:0;border-radius:10px;background:#f2a54a;color:#222;font-weight:800;padding:9px 14px}';
document.head.appendChild(css);
const ed=()=>window.YOMAK_PI?"نسخة Pi":"النسخة العامة";
const b=document.createElement("button");b.id="vbadge";b.type="button";b.textContent="v"+BUILD;b.setAttribute("aria-label","إصدار التطبيق");
b.onclick=()=>{if(typeof openModal!=="function")return;
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>إصدار التطبيق</h3><p><b>رقم الإصدار:</b> <span dir="ltr">'+BUILD+'</span></p><p><b>النسخة:</b> '+ed()+'</p><p><b>الرابط:</b> <span dir="ltr">'+location.host+'</span></p><p class="muted">لو مش شايف المميزات الجديدة اضغط الزر وهيحدّث التطبيق ويفتح من جديد (مش هيمسح حسابك).</p><button class="primary" onclick="yomakForceUpdate()">🔄 تحديث التطبيق الآن</button>')};
document.body.appendChild(b);
window.yomakForceUpdate=async function(){
  try{msg("جاري التحديث…")}catch(e){}
  try{if(navigator.serviceWorker){const r=await navigator.serviceWorker.getRegistrations();await Promise.all(r.map(x=>x.unregister()))}}catch(e){}
  try{if(window.caches){const k=await caches.keys();await Promise.all(k.map(x=>caches.delete(x)))}}catch(e){}
  location.replace(location.pathname+"?u="+Date.now())};
let shown=false;
function busy(){const a=document.activeElement;return !!document.getElementById("callUI")||!!(window.__call)||(a&&/^(TEXTAREA|INPUT)$/.test(a.tagName)&&a.value&&a.value.length>0)}
function banner(){if(document.getElementById("vban"))return;
  const d=document.createElement("div");d.id="vban";d.innerHTML='<span>🆕 نسخة جديدة من يومك جاهزة</span><button type="button">حدّث الآن</button>';
  d.querySelector("button").onclick=()=>yomakForceUpdate();document.body.appendChild(d)}
async function check(){
  try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const j=await r.json();
    const nv=parseInt(j&&j.v,10),cur=parseInt(BUILD,10);
    if(!(nv>cur))return;
    if(busy()){banner();return}
    let n=+sessionStorage.getItem("yk_auto_"+nv)||0;
    if(n<2){sessionStorage.setItem("yk_auto_"+nv,String(n+1));yomakForceUpdate();return}
    banner()}catch(e){}}
setTimeout(check,800);setInterval(check,120000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)check()});
window.addEventListener("focus",check);window.addEventListener("online",check);
})();
