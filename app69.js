/* v75: block + report a person from their profile; blocked list in Settings. Server side (SQL 2026-11-28-block-report) hides a blocked person's posts, comments, stories, reels and group messages both ways, and stops calls and DMs. */
(function(){
if(typeof PAGES==="undefined")return;
cl.blocks=cl.blocks||new Set();
const REASONS=["رسائل مزعجة أو إعلانات","إساءة أو تحرش","انتحال شخصية","محتوى غير لائق","نصب أو احتيال","سبب آخر"];
async function loadBlocks(){try{if(!cs())return;const r=await sb("/rest/v1/user_blocks?select=blocked");cl.blocks=new Set((r||[]).map(x=>x.blocked))}catch(e){}}
setTimeout(loadBlocks,2500);
function refreshAll(){try{cl.posts=null;cl.groups=null;cl.conv=!1;cl.stories=null}catch(e){}try{refresh()}catch(e){}}
window.ykBlockUser=async function(id){
  if(!cs())return authModal("login");
  if(cl.blocks.has(id)){try{await sb("/rest/v1/user_blocks?blocked=eq."+id,{method:"DELETE"});cl.blocks.delete(id);msg("تم إلغاء الحظر");refreshAll()}catch(e){msg(sbErr(e).slice(0,90))}return}
  if(!confirm("حظر الشخص ده؟ مش هيقدر يكلمك أو يتصل بيك، ومش هتشوف منشوراته وتعليقاته وستوريزه، وهو كمان مش هيشوف بتاعك."))return;
  try{await sb("/rest/v1/user_blocks?on_conflict=blocker,blocked",{method:"POST",prefer:"resolution=ignore-duplicates,return=minimal",body:{blocked:id}});cl.blocks.add(id);msg("تم الحظر 🚫");refreshAll()}catch(e){msg(sbErr(e).slice(0,90))}};
window.ykReportUser=function(id){
  if(!cs())return authModal("login");
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>🚩 إبلاغ عن شخص</h3><p class="muted">اختار السبب. البلاغ بيوصل للإدارة بشكل سري.</p>'+REASONS.map((r,i)=>'<button type="button" class="secondary" style="display:block;width:100%;margin:6px 0;text-align:right" onclick="ykSendUserReport(\''+id+'\','+i+')">'+r+'</button>').join(""))};
window.ykSendUserReport=async function(id,i){
  try{await sb("/rest/v1/reports",{method:"POST",prefer:"return=minimal",body:{kind:"user",target:id,author:id,reason:REASONS[i]||"مخالف"}});closeModal();msg("تم إرسال البلاغ، شكرًا لك")}catch(e){msg(sbErr(e).slice(0,90))}};
const _r=PAGES.user.render;
PAGES.user.render=function(e){
  const h=_r.apply(this,arguments)+"";const u=cs();
  if(!e||!u||e.id===u.uid)return h;
  const b=cl.blocks.has(e.id);
  return h+'<div class="card" style="display:flex;gap:8px"><button type="button" class="secondary" style="flex:1" onclick="ykReportUser(\''+e.id+'\')">🚩 إبلاغ</button><button type="button" class="secondary" style="flex:1" onclick="ykBlockUser(\''+e.id+'\')">'+(b?"✅ إلغاء الحظر":"🚫 حظر")+'</button></div>'};
if(PAGES.settings){const _s=PAGES.settings.render;
  PAGES.settings.render=function(){
    setTimeout(async()=>{const box=document.getElementById("ykBl");if(!box||!cs())return;
      try{const r=await sb("/rest/v1/user_blocks?select=blocked");const ids=(r||[]).map(x=>x.blocked);cl.blocks=new Set(ids);
        if(!ids.length){box.innerHTML='<p class="muted">مفيش حد محظور.</p>';return}
        const ps=await sb("/rest/v1/profiles?select=id,name&id=in.("+ids.join(",")+")");const nm={};(ps||[]).forEach(p=>nm[p.id]=p.name);
        box.innerHTML=ids.map(i=>'<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0"><span>'+esc(nm[i]||"مستخدم")+'</span><button type="button" class="chip" onclick="ykBlockUser(\''+i+'\');setTimeout(()=>{try{refresh()}catch(e){}},600)">إلغاء الحظر</button></div>').join("")}catch(e){box.innerHTML='<p class="muted">تعذر التحميل</p>'}},300);
    return _s.apply(this,arguments)+'<div class="card"><b>🚫 المحظورين</b><div id="ykBl"><p class="muted">جاري التحميل…</p></div></div>'}}
})();
