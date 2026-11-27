/* Phase 4E1: friends: requests, accept/decline, unfriend, friends list, suggestions, button on profiles. */
cl.fr={rows:[],loaded:0};
const frMe=()=>(cl.fr_me=(cs()||{}).uid);
async function frLoad(){
  const u=frMe();if(!u)return;
  try{
    cl.fr.rows=await sb("/rest/v1/friendships?select=*&or=(requester.eq."+u+",addressee.eq."+u+")&limit=500")||[];
    await loadPeople(cl.fr.rows.map(r=>r.requester===u?r.addressee:r.requester));cl.fr.loaded=1;
  }catch(e){cl.fr.err=sbErr(e)}
  const p=curPage();if(p==="friends"||p==="user")renderPage();
}
function frRel(uid){
  const u=frMe(),r=cl.fr.rows.find(r=>(r.requester===u&&r.addressee===uid)||(r.addressee===u&&r.requester===uid));
  if(!r)return{s:"none"};
  if(r.status==="accepted")return{s:"friends",r};
  return{s:r.requester===u?"sent":"incoming",r};
}
async function frAdd(uid){if(banStop())return;try{await ensureProfile();await sb("/rest/v1/friendships",{method:"POST",prefer:"return=minimal",body:{requester:frMe(),addressee:uid}});msg("اتبعت طلب الصداقة ✅");await frLoad()}catch(e){msg(sbErr(e).slice(0,90))}}
async function frAccept(id){try{await sb("/rest/v1/friendships?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{status:"accepted"}});msg("بقيتوا أصدقاء ✅");await frLoad()}catch(e){msg(sbErr(e).slice(0,90))}}
async function frDel(id,ask){if(ask&&!confirm(ask))return;try{await sb("/rest/v1/friendships?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});await frLoad()}catch(e){msg(sbErr(e).slice(0,90))}}
function frBtn(uid){
  if(!uid||uid===frMe())return"";const r=frRel(uid);
  if(r.s==="friends")return '<button class="chip on" onclick="frDel('+r.r.id+',\'إلغاء الصداقة؟\')">✓ أصدقاء</button>';
  if(r.s==="sent")return '<button class="chip" onclick="frDel('+r.r.id+')">⏳ إلغاء الطلب</button>';
  if(r.s==="incoming")return '<button class="chip on" onclick="frAccept('+r.r.id+')">قبول الطلب</button><button class="chip" onclick="frDel('+r.r.id+')">رفض</button>';
  return '<button class="chip" onclick="frAdd(\''+uid+'\')">＋ إضافة صديق</button>';
}
const _pu=PAGES.user.render,_pua=PAGES.user.after;
PAGES.user.render=function(e){
  const h=_pu.apply(this,arguments)+"";if(!e||!cs()||!cl.pp[e.id])return h;
  if(!cl.fr.loaded)frLoad();
  const i=h.indexOf('<div class="fact"');return i<0?h:h.slice(0,i)+'<div class="chips">'+frBtn(e.id)+'</div>'+h.slice(i);
};
function frRow(uid,btns){const p=cl.pp[uid]||{id:uid,name:"مستخدم"};return '<div class="person" onclick="openPage(\'user\',{id:\''+uid+'\'})">'+avHtml(p,40)+'<span class="pb"><b>'+esc(p.name||"")+vfMark(p)+'</b><small>'+esc(p.city||"")+'</small></span><span onclick="event.stopPropagation()">'+btns+'</span></div>'}
PAGES.friends={title:()=>"الأصدقاء",render:()=>{
  if(!cs())return authCard();if(!cl.fr.loaded){frLoad();return '<p class="muted">جاري التحميل…</p>'}
  const u=frMe(),inc=cl.fr.rows.filter(r=>r.status==="pending"&&r.addressee===u),sent=cl.fr.rows.filter(r=>r.status==="pending"&&r.requester===u),fr=cl.fr.rows.filter(r=>r.status==="accepted");
  const other=r=>r.requester===u?r.addressee:r.requester;
  let h='<input class="input" placeholder="ابحث عن شخص بالاسم" oninput="frSearch(this.value)"><div id="frRes"></div>';
  if(inc.length)h+='<div class="sub2">طلبات الصداقة ('+an(inc.length)+')</div>'+inc.map(r=>frRow(r.requester,'<button class="chip on" onclick="frAccept('+r.id+')">قبول</button><button class="chip" onclick="frDel('+r.id+')">رفض</button>')).join("");
  h+='<div class="sub2">أصدقائي ('+an(fr.length)+')</div>'+(fr.length?fr.map(r=>frRow(other(r),'<button class="chip" onclick="startDm(\''+other(r)+'\')">💬</button>')).join(""):'<div class="card empty">لسه مفيش أصدقاء. ابحث عن حد وأضفه.</div>');
  if(sent.length)h+='<div class="sub2">طلبات مرسلة</div>'+sent.map(r=>frRow(r.addressee,'<button class="chip" onclick="frDel('+r.id+')">إلغاء</button>')).join("");
  return h;
}};
let frT=null;
function frSearch(q){clearTimeout(frT);frT=setTimeout(async()=>{
  const b=el("frRes");if(!b)return;q=(q||"").trim();if(q.length<2){b.innerHTML="";return}
  try{const r=await sb("/rest/v1/profiles?select=id,name,username,avatar,city,country,verified,bio&name=ilike.*"+encodeURIComponent(q)+"*&limit=15");(r||[]).forEach(p=>cl.pp[p.id]=cl.pp[p.id]||p);
    b.innerHTML=(r||[]).filter(p=>p.id!==frMe()).map(p=>frRow(p.id,frBtn(p.id))).join("")||'<p class="muted">مفيش نتائج</p>'}catch(e){}
},300)}
const _gl3=window.gListHtml;
window.gListHtml=function(){return '<div class="card" onclick="openPage(\'friends\')" style="cursor:pointer"><b>🤝 الأصدقاء</b><p class="muted">طلبات الصداقة وقائمة أصدقائك والبحث عن ناس.</p></div>'+_gl3.apply(this,arguments)};
