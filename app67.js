/* Phone push for calls/messages: one-tap bar asks to turn on notifications (free Web Push). Re-syncs the saved subscription on every open. */
(function(){
const KEY="yk_push_dismiss";
function ok(){return "serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window}
async function has(){try{const r=await navigator.serviceWorker.ready;return !!(await r.pushManager.getSubscription())}catch(e){return false}}
function bar(){
  if(document.getElementById("pushBar"))return;
  const d=document.createElement("div");d.id="pushBar";
  d.style.cssText="position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 108px);z-index:9998;background:#123c3a;color:#fff;border-radius:14px;padding:10px 12px;display:flex;gap:8px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.3);font-size:14px";
  d.innerHTML='<span style="flex:1">🔔 فعّل الإشعارات علشان توصلك المكالمات والرسائل والتطبيق مقفول</span><button id="pushGo" style="background:#25d366;color:#04321f;border:0;border-radius:10px;padding:8px 12px;font-weight:700">تفعيل</button><button id="pushNo" style="background:none;border:0;color:#fff;font-size:18px">✕</button>';
  document.body.appendChild(d);
  document.getElementById("pushGo").onclick=async()=>{d.remove();if(typeof ykPushOn==="function")await ykPushOn()};
  document.getElementById("pushNo").onclick=()=>{d.remove();try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}}}
async function check(){
  try{if(!ok()||!cs()||document.getElementById("gate")||(document.getElementById("onboard")&&!document.getElementById("onboard").classList.contains("hide"))||document.getElementById("ykw")||document.getElementById("callUI"))return;
    if(Notification.permission==="denied")return;
    if(await has()){if(Notification.permission==="granted"&&typeof ykPushOn==="function"&&!window.__pushSynced){window.__pushSynced=1;ykPushOn().catch(()=>{})}return}
    const t=+localStorage.getItem(KEY)||0;if(Date.now()-t<3*864e5)return;
    if(window.matchMedia&&/iPhone|iPad/.test(navigator.userAgent)&&!window.matchMedia("(display-mode: standalone)").matches)return;
    bar()}catch(e){}}
setTimeout(check,6000);setInterval(check,60000);
})();
