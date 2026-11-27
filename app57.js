/* Call buttons: voice + video button in every private chat, and a call history list (chip "📞 المكالمات" in the chats list). */
(function(){
function addVid(){document.querySelectorAll('button[aria-label="اتصال صوتي"]:not([data-v])').forEach(b=>{b.dataset.v=1;
  const m=(b.getAttribute("onclick")||"").match(/callStart\('([^']+)'\)/);if(!m)return;
  const v=document.createElement("button");v.className=b.className;v.setAttribute("aria-label","مكالمة فيديو");v.textContent="📹";v.setAttribute("onclick","callVideo('"+m[1]+"')");b.insertAdjacentElement("afterend",v)})}
new MutationObserver(addVid).observe(document.documentElement,{childList:true,subtree:true});
window.callVideo=async function(peer){
  await callStart(peer);let n=0;
  const t=setInterval(()=>{n++;if(document.getElementById("callT")){clearInterval(t);setTimeout(()=>{try{callCam()}catch(e){}},600)}else if(n>120)clearInterval(t)},500)};
const och=window.chatHtml;
window.chatHtml=function(){
  const h=och.apply(this,arguments)+"";
  return h.replace(/(📦 الأرشيف<\/button>)/,'$1<button class="chip" onclick="callHistory()">📞 المكالمات</button>')};
const IC=t=>/فائتة/.test(t)?"📵":/مرفوضة/.test(t)?"🚫":/فيديو/.test(t)?"📹":"📞";
window.callHistory=async function(){
  if(!cs())return authModal("login");
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>سجل المكالمات</h3><div id="chRows"><p class="muted">جاري التحميل…</p></div>');
  try{const r=await sb("/rest/v1/dm_messages?kind=eq.call&select=id,chat_id,user_id,body,created_at&order=id.desc&limit=60")||[];
    const me=cs().uid,box=document.getElementById("chRows");if(!box)return;
    if(!r.length){box.innerHTML='<p class="muted">مفيش مكالمات لسه.</p>';return}
    box.innerHTML=r.map(m=>{const x=(cl.dm||[]).find(c=>c.id===m.chat_id);if(!x)return"";const o=dmOther(x),out=m.user_id===me,t=(m.body||"").replace(/^[^ ]+ /,"");
      return '<div class="mrow2" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #eee"><span style="font-size:22px">'+IC(m.body)+'</span><div style="flex:1;text-align:right"><b>'+esc(dmName(x))+'</b><br><small class="muted">'+(out?"صادرة":"واردة")+" · "+esc(t)+" · "+agoAr(m.created_at)+'</small></div><button class="pact" aria-label="اتصال" onclick="closeModal();callStart(\''+esc(o)+'\')">📞</button></div>'}).join("")||'<p class="muted">مفيش مكالمات لسه.</p>'}
  catch(e){const b=document.getElementById("chRows");if(b)b.textContent=sbErr(e).slice(0,80)}};
})();
