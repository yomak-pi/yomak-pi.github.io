/* Friend suggestions (friends of friends, ranked by mutual count; same-city fallback) + mutual friends list. */
(function(){
const sg={list:null,busy:0,mut:{}};
const me=()=>{try{return frMe()}catch(e){return (cs()||{}).uid}};
async function load(){
  if(sg.busy)return;sg.busy=1;
  try{
    const u=me(),rows=(cl.fr&&cl.fr.rows)||[],mine=new Set([u]);rows.forEach(r=>{mine.add(r.requester);mine.add(r.addressee)});
    rows.forEach(r=>{mine.add(r.requester);mine.add(r.addressee)});
    const cnt={};sg.mut={};
    const r=await sb("/rest/v1/rpc/friend_suggestions",{method:"POST",body:{}})||[];
    r.forEach(x=>{if(UUID_RE.test(x.id)){cnt[x.id]=(x.mutual||[]).length;sg.mut[x.id]=x.mutual||[]}});
    let ids=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x]).slice(0,12);
    if(ids.length<8){
      const mp=(cl.pp&&cl.pp[u])||{};const city=mp.city;
      let q="/rest/v1/profiles?select=id,name,username,avatar,city,country,verified,bio&order=created_at.desc&limit=30";
      if(city)q+="&city=eq."+encodeURIComponent(city);
      const p=await sb(q)||[];
      p.forEach(x=>{cl.pp[x.id]=cl.pp[x.id]||x;if(!mine.has(x.id)&&!ids.includes(x.id)&&ids.length<12)ids.push(x.id)})}
    if(ids.length)await loadPeople(ids);
    sg.list=ids.map(i=>({id:i,n:cnt[i]||0}));
  }catch(e){sg.list=[]}
  sg.busy=0;if(curPage()==="friends")renderPage();
}
function box(){
  if(sg.list===null)return '<p class="muted">جاري تحميل الاقتراحات…</p>';
  if(!sg.list.length)return "";
  return '<div class="sub2">أشخاص قد تعرفهم</div><div id="sgBox">'+sg.list.map(s=>{
    const p=cl.pp[s.id]||{};
    return '<div class="card" style="display:flex;align-items:center;gap:8px;margin:6px 0"><div style="flex:1" onclick="openUser(\''+s.id+'\')"><b>'+esc(p.name||"مستخدم")+'</b>'+
     (s.n?'<div class="muted"><a href="#" style="color:inherit" onclick="sgMutual(\''+s.id+'\');return false">👥 '+an(s.n)+' صديق مشترك</a></div>':(p.city?'<div class="muted">📍 '+esc(p.city)+'</div>':""))+'</div>'+
     '<button class="chip on" onclick="sgAdd(\''+s.id+'\')">➕ إضافة</button><button class="chip" onclick="sgHide(\''+s.id+'\')">✖</button></div>'}).join("")+'</div>'}
const oldR=PAGES.friends&&PAGES.friends.render;
if(oldR)PAGES.friends.render=function(){
  const h=oldR();
  if(!cs()||!cl.fr||!cl.fr.loaded)return h;
  if(sg.list===null&&!sg.busy)setTimeout(load,0);
  const i=h.indexOf('<div class="sub2">أصدقائي');
  const b=box();return i<0?h+b:h.slice(0,i)+b+h.slice(i)};
window.sgAdd=async function(id){await frAdd(id);sg.list=(sg.list||[]).filter(s=>s.id!==id);if(curPage()==="friends")renderPage()};
window.sgHide=function(id){sg.list=(sg.list||[]).filter(s=>s.id!==id);if(curPage()==="friends")renderPage()};
window.sgMutual=async function(id){
  const ids=sg.mut[id]||[];try{await loadPeople(ids)}catch(e){}
  const p=cl.pp[id]||{};
  const rows=ids.map(i=>{const q=cl.pp[i]||{};return '<div class="card" style="margin:6px 0" onclick="closeModal();openUser(\''+i+'\')"><b>'+esc(q.name||"مستخدم")+'</b></div>'}).join("");
  formModal("👥 أصدقاء مشتركين مع "+esc(p.name||""),rows||'<p class="muted">مفيش</p>',()=>{closeModal();return false},{save:"تمام"})};
})();
