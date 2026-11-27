/* Post controls: pin to my profile, turn comments off, hide a post for me. */
(function(){
const hid=new Set();let loaded=false;
try{JSON.parse(localStorage.getItem("yomak_hid")||"[]").forEach(i=>hid.add(i))}catch(e){}
function save(){try{localStorage.setItem("yomak_hid",JSON.stringify([...hid].slice(-500)))}catch(e){}}
async function load(){if(loaded||!cs())return;loaded=true;
  try{const r=await sb("/rest/v1/post_hides?select=post_id&limit=1000")||[];r.forEach(x=>hid.add(x.post_id));save()}catch(e){loaded=false}}
setTimeout(load,2500);
const osc=window.svcCard;
window.svcCard=function(e){
  if(e&&e.id&&hid.has(e.id)&&!(cs()&&e.user_id===cs().uid))return "";
  let h=osc.apply(this,arguments);if(!e||!/^[0-9a-f-]{36}$/i.test(e.id||""))return h;
  h=h.replace('<button class="pact" aria-label="نسخ"','<button class="pact" aria-label="المزيد" onclick="pcMenu(\''+e.id+'\')">⋯</button><button class="pact" aria-label="نسخ"');
  let note="";if(e.pinned_at)note+='<small class="pcnote">📌 منشور مثبّت</small> ';if(e.comments_off)note+='<small class="pcnote">🔒 التعليقات مقفولة</small>';
  if(note){const k=h.indexOf('<div class="eng">');const n='<div style="margin:4px 0;color:#667">'+note+'</div>';h=k>0?h.slice(0,k)+n+h.slice(k):h}
  return h};
const ocd=window.cmDraw;
window.cmDraw=function(id){const r=ocd.apply(this,arguments);
  try{const p=allFeedPosts().find(x=>x.id===id);if(p&&p.comments_off)document.querySelectorAll("#cm-"+id+" .cmin").forEach(x=>{x.outerHTML='<p class="muted" style="margin:6px 0">🔒 صاحب المنشور قفل التعليقات</p>'})}catch(e){}
  return r};
function sortPins(){try{if(fd.u&&fd.u.list)fd.u.list.sort((a,b)=>(b.pinned_at?1:0)-(a.pinned_at?1:0)||String(b.created_at).localeCompare(String(a.created_at)))}catch(e){}}
["render","renderPage"].forEach(n=>{const o=window[n];if(typeof o!=="function")return;window[n]=function(){sortPins();return o.apply(this,arguments)}});
window.pcMenu=function(id){
  const p=allFeedPosts().find(x=>x.id===id);if(!p)return;const s=cs();if(!s)return authModal("login");
  const mine=p.user_id===s.uid;
  const b=(t,f)=>'<button class="secondary" style="display:block;width:100%;margin:6px 0;text-align:right" onclick="'+f+'">'+t+'</button>';
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>خيارات المنشور</h3>'+
    (mine?b(p.pinned_at?"📌 إلغاء تثبيت المنشور":"📌 تثبيت المنشور في صفحتي","pcSet('"+id+"','pin')")+b(p.comments_off?"💬 فتح التعليقات":"🔒 قفل التعليقات","pcSet('"+id+"','cm')"):
      b("🙈 إخفاء المنشور ده عني","pcHide('"+id+"')")))};
window.pcSet=async function(id,w){
  const p=allFeedPosts().find(x=>x.id===id);if(!p||banStop())return;
  const patch=w==="pin"?{pinned_at:p.pinned_at?null:new Date().toISOString()}:{comments_off:!p.comments_off};
  try{await sb("/rest/v1/service_posts?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:patch});
    [].concat(fd.list||[],fd.u.list||[]).forEach(x=>{if(x.id===id)Object.assign(x,patch)});
    closeModal();msg(w==="pin"?(patch.pinned_at?"اتثبّت في صفحتك":"اتلغى التثبيت"):(patch.comments_off?"التعليقات اتقفلت":"التعليقات اتفتحت"));
    render();renderPage()}catch(e){msg(sbErr(e).slice(0,80))}};
window.pcHide=async function(id){
  hid.add(id);save();closeModal();msg("اتخفى المنشور");render();renderPage();
  try{await sb("/rest/v1/post_hides",{method:"POST",prefer:"return=minimal",body:{post_id:id}})}catch(e){}};
})();
