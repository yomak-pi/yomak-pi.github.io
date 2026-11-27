/* Birthdays (friends page card + settings form) and Memories ("on this day" from your own posts). */
(function(){
const bd={list:null,busy:0,mine:null,mload:0};
const UID=()=>(cs()||{}).uid;
const AM=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const daysUntil=(m,d)=>{const n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate()),x=new Date(n.getFullYear(),m-1,d);if(x<t)x.setFullYear(x.getFullYear()+1);return Math.round((x-t)/864e5)};
async function load(){
  if(bd.busy)return;bd.busy=1;
  try{
    const r=await sb("/rest/v1/user_birthdays?select=*&limit=500")||[];
    bd.mine=r.find(x=>x.user_id===UID())||null;
    const o=r.filter(x=>x.user_id!==UID()).map(x=>({...x,n:daysUntil(x.bmonth,x.bday)})).filter(x=>x.n<=14).sort((a,b)=>a.n-b.n).slice(0,15);
    if(o.length)await loadPeople(o.map(x=>x.user_id));
    bd.list=o;
  }catch(e){bd.list=[]}
  bd.busy=0;const p=curPage();if(p==="friends"||p==="settings")renderPage();
}
function box(){
  if(bd.list===null)return"";
  if(!bd.list.length)return"";
  return '<div class="sub2">🎂 أعياد ميلاد قريبة</div>'+bd.list.map(x=>{const p=cl.pp[x.user_id]||{};
    return '<div class="card" style="display:flex;align-items:center;gap:8px;margin:6px 0"><div style="flex:1" onclick="openUser(\''+x.user_id+'\')"><b>'+esc(p.name||"مستخدم")+'</b><div class="muted">'+(x.n===0?"🎉 النهاردة عيد ميلاده":x.n===1?"بكرة":"بعد "+an(x.n)+" يوم")+" · "+an(x.bday)+" "+AM[x.bmonth-1]+'</div></div><button class="chip on" onclick="bdWish(\''+x.user_id+'\')">🎁 تهنئة</button></div>'}).join("")}
const oldF=PAGES.friends&&PAGES.friends.render;
if(oldF)PAGES.friends.render=function(){const h=oldF();if(!cs()||!cl.fr||!cl.fr.loaded)return h;
  if(bd.list===null&&!bd.busy)setTimeout(load,0);
  const i=h.indexOf('<div class="sub2">أصدقائي');const b=box();return i<0?h+b:h.slice(0,i)+b+h.slice(i)};
window.bdWish=function(id){try{startDm(id)}catch(e){}
  setTimeout(()=>{const i=document.querySelector("#dmText,#dmIn,textarea,input.input");if(i&&!i.value){i.value="كل سنة وأنت طيب 🎂🎉";i.dispatchEvent(new Event("input",{bubbles:true}))}},900)};
const oldS=PAGES.settings&&PAGES.settings.render;
if(oldS)PAGES.settings.render=function(){
  const h=oldS();if(!cs())return h;if(bd.mine===null&&!bd.busy&&!bd.mload){bd.mload=1;setTimeout(load,0)}
  const m=bd.mine;
  return h+'<div class="card"><b>🎂 عيد ميلادي</b><p class="muted">'+(m?an(m.bday)+" "+AM[m.bmonth-1]+" · "+({public:"الكل",friends:"الأصدقاء",me:"أنا فقط"})[m.visibility]:"لسه مضفتش")+'</p><button class="chip on" onclick="bdEdit()">'+(m?"تعديل":"إضافة")+'</button>'+(m?'<button class="chip" onclick="bdDel()">حذف</button>':"")+'</div>'};
window.bdEdit=function(){
  const m=bd.mine||{bmonth:1,bday:1,visibility:"friends"};
  formModal("🎂 عيد ميلادي",selF("bdM","الشهر",AM.map((n,i)=>[String(i+1),n]),String(m.bmonth))+selF("bdD","اليوم",Array.from({length:31},(_,i)=>[String(i+1),String(i+1)]),String(m.bday))+selF("bdV","مين يشوفه؟",[["friends","👥 الأصدقاء"],["public","🌍 الكل"],["me","🔒 أنا فقط"]],m.visibility),
   ()=>{(async()=>{try{await ensureProfile();const b={user_id:UID(),bmonth:+val("bdM"),bday:+val("bdD"),visibility:val("bdV"),updated_at:new Date().toISOString()};
     if(b.bday>new Date(2024,b.bmonth,0).getDate()){msg("اليوم ده مش موجود في الشهر");return}
     await sb("/rest/v1/user_birthdays?on_conflict=user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:b});
     bd.mine=b;bd.list=null;closeModal();msg("اتحفظ ✅");if(curPage()==="settings")renderPage()}catch(e){msg(sbErr(e).slice(0,90))}})();return false},{save:"حفظ"})};
window.bdDel=async function(){try{await sb("/rest/v1/user_birthdays?user_id=eq."+UID(),{method:"DELETE",prefer:"return=minimal"});bd.mine=null;msg("اتحذف");renderPage()}catch(e){msg(sbErr(e).slice(0,90))}};
/* Memories */
const mem={list:null};
const old=window.gListHtml;
if(typeof old==="function")window.gListHtml=function(){return '<div class="card" onclick="openPage(\'memories\')" style="cursor:pointer"><b>🕰 ذكريات</b><p class="muted">منشوراتك في مثل النهاردة من السنين اللي فاتت</p></div>'+old.apply(this,arguments)};
async function mload(){
  mem.list=[];
  try{
    const rows=await sb("/rest/v1/service_posts?select=*&user_id=eq."+UID()+"&order=created_at.desc&limit=500")||[];
    const n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate());
    mem.list=rows.filter(x=>{const c=new Date(x.created_at);return c.getFullYear()<n.getFullYear()&&Math.abs(new Date(n.getFullYear(),c.getMonth(),c.getDate())-t)<=864e5*0.5})
  }catch(e){}
  if(curPage()==="memories")renderPage();
}
PAGES.memories={title:()=>"ذكريات",render:()=>{
  if(!cs())return authCard();
  if(mem.list===null){mload();return '<p class="muted">جاري التحميل…</p>'}
  return mem.list.length?'<p class="muted">في مثل النهاردة 🕰</p>'+mem.list.map(x=>{const y=new Date().getFullYear()-new Date(x.created_at).getFullYear();
    return '<div class="muted" style="margin:10px 0 2px">من '+an(y)+' سنة</div>'+(window.svcCard?window.svcCard(x):'<div class="card">'+esc(x.title||"")+'</div>')}).join(""):'<div class="card empty"><b>مفيش ذكريات النهاردة</b><p class="muted">لما يبقى عندك منشورات قديمة في نفس اليوم هتظهر هنا.</p></div>'}};
})();
