/* Events: create, RSVP (going / interested / not going), counts, who is going. Entry card sits in the Groups tab. */
(function(){
const ev={list:null,tab:"up",c:{},loaded:0};
const UID=()=>(cs()||{}).uid;
const old=window.gListHtml;
if(typeof old==="function")window.gListHtml=function(){return '<div class="card" onclick="openPage(\'events\')" style="cursor:pointer"><b>📅 الفعاليات</b><p class="muted">اعمل فعالية أو شوف الفعاليات القريبة وقول رايح ولا لأ.</p></div>'+old.apply(this,arguments)};
const fmt=iso=>{try{return new Date(iso).toLocaleString("ar-EG",{weekday:"long",day:"numeric",month:"long",hour:"numeric",minute:"2-digit"})}catch(e){return iso}};
async function load(){
  ev.loaded=1;
  try{
    const since=new Date(Date.now()-3*3600e3).toISOString();let rows;
    if(ev.tab==="mine"&&UID()){
      const r=await sb("/rest/v1/event_rsvps?select=event_id,status&user_id=eq."+UID()+"&status=in.(going,interested)&limit=200")||[];
      const ids=r.map(x=>x.event_id).filter(i=>UUID_RE.test(i));
      const a=ids.length?await sb("/rest/v1/events?select=*&id=in.("+ids.join(",")+")&order=starts_at.asc"):[];
      const b=await sb("/rest/v1/events?select=*&user_id=eq."+UID()+"&order=starts_at.asc&limit=100")||[];
      const m={};(a||[]).concat(b).forEach(x=>m[x.id]=x);rows=Object.values(m).sort((x,y)=>String(x.starts_at).localeCompare(String(y.starts_at)))}
    else rows=await sb("/rest/v1/events?select=*&starts_at=gte."+encodeURIComponent(since)+"&order=starts_at.asc&limit=60")||[];
    ev.list=rows;
    try{await loadPeople(rows.map(x=>x.user_id))}catch(e){}
    if(UID()&&rows.length){const c=await sb("/rest/v1/rpc/event_counts",{method:"POST",body:{ids:rows.map(x=>x.id)}})||[];
      rows.forEach(x=>ev.c[x.id]={going:0,interested:0,mine:null});c.forEach(x=>ev.c[x.event_id]={going:Number(x.going),interested:Number(x.interested),mine:x.mine})}
  }catch(e){ev.err=sbErr(e)}
  if(curPage()==="events")renderPage();
}
function card(x){
  const c=ev.c[x.id]||{going:0,interested:0,mine:null},u=cl.pp[x.user_id]||{},mine=x.user_id===UID();
  const b=(k,t)=>'<button class="chip'+(c.mine===k?" on":"")+'" onclick="evRsvp(\''+x.id+'\',\''+k+'\')">'+t+'</button>';
  return '<div class="card" style="margin:10px 0"><div style="font-weight:800;font-size:17px">'+esc(x.title)+'</div>'+
   '<div class="muted" style="margin-top:4px">🗓 '+esc(fmt(x.starts_at))+'</div>'+
   (x.place||x.city?'<div class="muted">📍 '+esc([x.place,x.city].filter(Boolean).join("، "))+'</div>':"")+
   '<div class="muted" style="margin-bottom:6px">👤 '+esc(u.name||"مستخدم")+(x.visibility==="friends"?" · 👥 للأصدقاء":"")+'</div>'+
   (x.body?'<p class="fb" style="white-space:pre-wrap">'+esc(x.body)+'</p>':"")+
   '<div class="muted" style="margin:6px 0"><a href="#" onclick="evWho(\''+x.id+'\');return false">✅ '+an(c.going)+' رايح · ⭐ '+an(c.interested)+' مهتم</a></div>'+
   '<div style="display:flex;gap:6px;flex-wrap:wrap">'+b("going","✅ رايح")+b("interested","⭐ مهتم")+b("no","✖ مش جاي")+
   (mine||cl.admin?'<button class="chip" onclick="evDel(\''+x.id+'\')">🗑 حذف</button>':"")+'</div></div>'}
PAGES.events={title:()=>"الفعاليات",render:()=>{
  if(!cs())return authCard();
  if(!ev.loaded)load();
  const t=(k,l)=>'<button class="chip'+(ev.tab===k?" on":"")+'" onclick="evTab(\''+k+'\')">'+l+'</button>';
  return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+t("up","القادمة")+t("mine","فعالياتي")+'<button class="chip" style="margin-inline-start:auto;background:#155b50;color:#fff" onclick="evNew()">＋ فعالية جديدة</button></div>'+
   (ev.list===null?'<p class="muted">جاري التحميل…</p>':ev.err?'<p class="muted">'+esc(ev.err)+'</p>':ev.list.length?ev.list.map(card).join(""):'<p class="muted">مفيش فعاليات هنا لسه. اعمل أول واحدة!</p>')}};
window.evTab=k=>{ev.tab=k;ev.list=null;ev.loaded=0;renderPage()};
window.evNew=function(){
  if(!cs())return authModal("login");
  const d=new Date(Date.now()+86400e3);d.setMinutes(0,0,0);const loc=new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,16);
  formModal("📅 فعالية جديدة",inp("eTitle","اسم الفعالية","",{max:100})+inp("eBody","التفاصيل (اختياري)","",{area:1,rows:3,max:1000})+inp("eWhen","موعد البداية",loc,{type:"datetime-local"})+inp("ePlace","المكان (اختياري)","",{max:120})+inp("eCity","المدينة (اختياري)",(d&&window.d&&window.d.city)||"",{max:60})+selF("eVis","مين يشوفها؟",[["public","🌍 الكل"],["friends","👥 الأصدقاء"]],"public"),
   ()=>{const t=(val("eTitle")||"").trim(),w=val("eWhen");
     if(t.length<3){msg("اكتب اسم الفعالية");return false}
     if(!w){msg("اختار الموعد");return false}
     const at=new Date(w);if(isNaN(+at)){msg("الموعد مش مظبوط");return false}
     (async()=>{try{await ensureProfile();
       await sb("/rest/v1/events",{method:"POST",prefer:"return=minimal",body:{title:t.slice(0,100),body:(val("eBody")||"").trim().slice(0,1000)||null,starts_at:at.toISOString(),place:(val("ePlace")||"").trim().slice(0,120)||null,city:(val("eCity")||"").trim().slice(0,60)||null,visibility:val("eVis")==="friends"?"friends":"public"}});
       closeModal();msg("اتعملت الفعالية 🎉");ev.tab="up";ev.list=null;ev.loaded=0;if(curPage()==="events")renderPage();else openPage("events")}catch(e){msg(sbErr(e).slice(0,90))}})();
     return false},{save:"نشر الفعالية"})};
window.evRsvp=async function(id,k){
  if(!cs())return authModal("login");if(banStop())return;
  const c=ev.c[id]||(ev.c[id]={going:0,interested:0,mine:null}),was=c.mine;
  try{
    if(was===k){await sb("/rest/v1/event_rsvps?event_id=eq."+id+"&user_id=eq."+UID(),{method:"DELETE",prefer:"return=minimal"});c.mine=null}
    else{await sb("/rest/v1/event_rsvps?on_conflict=event_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{event_id:id,status:k}});c.mine=k}
    if(was==="going")c.going=Math.max(0,c.going-1);if(was==="interested")c.interested=Math.max(0,c.interested-1);
    if(c.mine==="going")c.going++;if(c.mine==="interested")c.interested++;
    renderPage()}catch(e){msg(sbErr(e).slice(0,80))}};
window.evDel=async function(id){
  if(!confirm("حذف الفعالية؟"))return;
  try{await sb("/rest/v1/events?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});ev.list=(ev.list||[]).filter(x=>x.id!==id);msg("اتحذفت");renderPage()}catch(e){msg(sbErr(e).slice(0,80))}};
window.evWho=async function(id){
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>مين رايح؟</h3><div id="evWho"><p class="muted">جاري التحميل…</p></div>');
  try{const r=await sb("/rest/v1/event_rsvps?select=user_id,status&event_id=eq."+id+"&status=in.(going,interested)&limit=200")||[];
    try{await loadPeople(r.map(x=>x.user_id))}catch(e){}
    const b=document.getElementById("evWho");if(!b)return;
    const row=(x)=>'<div style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">'+(x.status==="going"?"✅ ":"⭐ ")+'<b role="button" onclick="closeModal();openUser(\''+x.user_id+'\')">'+esc((cl.pp[x.user_id]||{}).name||"مستخدم")+'</b></div>';
    b.innerHTML=r.length?r.map(row).join(""):'<p class="muted">لسه محدش رد.</p>'}catch(e){const b=document.getElementById("evWho");if(b)b.textContent=sbErr(e).slice(0,80)}};
})();
