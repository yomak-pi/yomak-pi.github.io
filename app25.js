/* Phase 4D1: Groups like Facebook: types (public/private/hidden), roles, rules, approval, pin, bans, invite link, members, manage. */
cl.gset=cl.gset||{};cl.myreq=cl.myreq||{};cl.gx=cl.gx||{};
const GT={public:["🌍","عام","أي حد يشوف المنشورات وينضم"],private:["🔒","خاص","الكل يشوف الجروب، لكن الانضمام بموافقة والمنشورات للأعضاء"],hidden:["🙈","مخفي","مش بيظهر في البحث، بالدعوة فقط"]};
const gPriv=id=>((cl.gset[id]||{}).privacy)||"public";
const _lc1=window.loadConv;
window.loadConv=async function(){
  await _lc1.apply(this,arguments);const u=cs();if(!u)return;
  try{
    const[s,r]=await Promise.all([sb("/rest/v1/group_settings?select=group_id,privacy,rules,post_approval,cover_url&limit=500"),sb("/rest/v1/group_join_requests?select=group_id,status&user_id=eq."+u.uid)]);
    cl.gset={};(s||[]).forEach(x=>cl.gset[x.group_id]=x);cl.myreq={};(r||[]).forEach(x=>cl.myreq[x.group_id]=x.status);
    for(const g of Object.keys(cl.myreq)){if(cl.myreq[g]==="approved"&&!cl.mine[g]){try{await sb("/rest/v1/group_members",{method:"POST",prefer:"return=minimal",body:{group_id:g}});cl.mine[g]=1;msg("اتقبل طلب انضمامك لجروب ✅")}catch(e){}}}
    const gl=el("gList");gl&&(gl.innerHTML=gListHtml());
  }catch(e){}
};
function grpCard(e){
  const mine=!!cl.mine[e.id],p=gPriv(e.id),t=GT[p]||GT.public,rq=cl.myreq[e.id];
  const btn=mine?'<button class="chip on" onclick="openGroup(\''+esc(e.id)+'\',\'posts\')">فتح</button><button class="chip" onclick="openGroup(\''+esc(e.id)+'\',\'chat\')">💬 الشات</button>':rq==="pending"?'<span class="chip">⏳ بانتظار الموافقة</span><button class="chip" onclick="openGroup(\''+esc(e.id)+'\',\'about\')">عرض</button>':'<button class="chip" onclick="joinGroup(\''+esc(e.id)+'\')">'+(p==="public"?"انضمام":"طلب انضمام")+'</button><button class="chip" onclick="openGroup(\''+esc(e.id)+'\',\'posts\')">عرض</button>';
  return '<div class="card"><b>'+esc(e.name)+'</b> <span class="pill">'+t[0]+' '+t[1]+'</span> <span class="pill">'+("SA"===e.country?"🇸🇦":"EG"===e.country?"🇪🇬":"")+' '+an(grpCount(e))+' عضو</span>'+(e.description?'<p class="muted">'+esc(e.description)+'</p>':"")+'<div class="chips">'+btn+'</div></div>';
}
async function joinGroup(id){
  if(banStop())return;if(!cs())return authModal("login");
  try{
    await ensureProfile();const p=gPriv(id);
    if(p==="public"){await sb("/rest/v1/group_members",{method:"POST",prefer:"return=minimal",body:{group_id:id}});cl.mine[id]=1;msg("تم الانضمام")}
    else{await sb("/rest/v1/group_join_requests?on_conflict=group_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{group_id:id,status:"pending"}});cl.myreq[id]="pending";msg("اتبعت طلب الانضمام للمشرفين ✅")}
    cl.gx[id]=null;if("group"===curPage())gLoad(id);else{cl.groups=null;cl.conv=!1;refresh()}renderPage&&"group"===curPage()&&renderPage();
  }catch(e){msg(sbErr(e).slice(0,100))}
}
/* create group with type and rules */
function groupModal(){
  formModal("إنشاء جروب",inp("gName","اسم الجروب","",{max:60})+inp("gDesc","وصف (اختياري)","",{area:1,max:300,rows:3})+
    '<label class="lbl">نوع الجروب</label><select id="gType" class="input">'+Object.keys(GT).map(k=>'<option value="'+k+'">'+GT[k][0]+" "+GT[k][1]+" — "+GT[k][2]+'</option>').join("")+'</select>'+
    inp("gRules","قواعد الجروب (اختياري)","",{area:1,max:1500,rows:3})+'<label class="chkrow"><input id="gAppr" type="checkbox"> المنشورات تحتاج موافقة المشرف</label><p id="gErr" class="muted" style="color:#b0352d;overflow-wrap:anywhere"></p>',()=>(createGroup(),!1),{save:"إنشاء"});
}
async function createGroup(){
  if(banStop())return;const n=val("gName");if(n.length<2)return msg("اكتب اسم الجروب (حرفين على الأقل)");
  try{
    await ensureProfile();
    const t=await sb("/rest/v1/groups",{method:"POST",prefer:"return=representation",body:{name:n,description:val("gDesc"),country:d.country}}),id=t&&t[0]&&t[0].id;
    if(!id)throw{message:"تعذر إنشاء الجروب"};
    await sb("/rest/v1/group_members",{method:"POST",body:{group_id:id}});
    const ty=el("gType").value,ru=val("gRules");
    await sb("/rest/v1/group_settings?on_conflict=group_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{group_id:id,privacy:GT[ty]?ty:"public",rules:ru||null,post_approval:!!el("gAppr").checked}});
    cl.groups=null;cl.conv=!1;closeModal();refresh();msg("تم إنشاء الجروب");
  }catch(e){showErr("gErr",e)}
}
/* group page */
const gMe=()=>(cs()||{}).uid;
function gRole(id){const u=gMe(),x=cl.gx[id];if(!x||!u)return "";const g=(cl.groups||[]).find(g=>g.id===id);if(g&&g.owner===u)return "owner";const a=(x.admins||[]).find(a=>a.user_id===u);return a?a.role:(cl.admin?"super":"")}
const gIsAdmin=id=>["owner","admin","super"].includes(gRole(id)),gIsMod=id=>gIsAdmin(id)||gRole(id)==="moderator";
async function gLoad(id){
  const u=gMe();if(!u||!UUID_RE.test(id))return;
  try{
    const[mem,adm,set,posts,imgs]=await Promise.all([
      sb("/rest/v1/group_members?select=user_id&group_id=eq."+id+"&limit=500"),
      sb("/rest/v1/group_admins?select=user_id,role&group_id=eq."+id),
      sb("/rest/v1/group_settings?select=*&group_id=eq."+id),
      sb("/rest/v1/posts?select=id,body,created_at,user_id,status,pinned,profiles(name)&group_id=eq."+id+"&order=created_at.desc&limit=50"),
      sb("/rest/v1/group_post_images?select=post_id,url&limit=500").catch(()=>[])]);
    const x={members:mem||[],admins:adm||[],posts:posts||[],imgs:{}};
    (imgs||[]).forEach(i=>(x.imgs[i.post_id]=x.imgs[i.post_id]||[]).push(i.url));
    if(set&&set[0])cl.gset[id]=set[0];
    cl.gx[id]=x;
    const g=(cl.groups||[]).find(g=>g.id===id);if(g&&g.owner===u)x.admins.push({user_id:u,role:"owner"});
    await loadPeople(x.members.map(m=>m.user_id).concat(x.posts.map(p=>p.user_id)));
    if(gIsMod(id)){
      const[rq,bn]=await Promise.all([sb("/rest/v1/group_join_requests?select=id,user_id,created_at&group_id=eq."+id+"&status=eq.pending").catch(()=>[]),sb("/rest/v1/group_bans?select=*&group_id=eq."+id).catch(()=>[])]);
      x.reqs=rq||[];x.bans=bn||[];await loadPeople(x.reqs.map(r=>r.user_id).concat(x.bans.map(b=>b.user_id)));
    }
    try{await loadEngage(x.posts.filter(p=>p.status==="published"))}catch(e){}
  }catch(e){cl.gx[id]={members:[],admins:[],posts:[],imgs:{},err:sbErr(e)}}
  if("group"===curPage()){renderPage();x2draw(id)}
}
function x2draw(id){const x=cl.gx[id];if(!x)return;(x.posts||[]).forEach(p=>{try{likeDraw(p.id)}catch(e){}})}
const _oldGroup=PAGES.group;
PAGES.group={title:e=>esc(e&&e.name||"جروب"),render:e=>{
  const u=cs();if(!u)return authCard();
  const id=e&&e.id,g=(cl.groups||[]).find(g=>g.id===id);
  if(!g)return '<div class="empty">الجروب غير متاح</div>';
  const x=cl.gx[id];if(!x)return '<p class="muted">جاري التحميل…</p>';
  const p=gPriv(id),t=GT[p]||GT.public,mine=!!cl.mine[id],role=gRole(id),mod=gIsMod(id),cover=(cl.gset[id]||{}).cover_url;
  const tab=["posts","chat","members","about","manage"].includes(cl.tab)?cl.tab:"posts";
  const pend=(x.reqs||[]).length+(x.posts||[]).filter(p=>p.status==="pending").length;
  let h='<div class="gcover" style="'+(cover&&imgOk(cover)?'background-image:url('+esc(cover)+')':'')+'"></div><div class="card" style="margin-top:-24px;position:relative"><b style="font-size:18px">'+esc(g.name)+'</b><div class="muted">'+t[0]+' '+t[1]+' · '+an(x.members.length)+' عضو'+(role&&role!=="super"?' · '+(role==="owner"?"👑 المالك":role==="admin"?"🛡️ مشرف":"🔧 مراقب"):"")+'</div>'+(g.description?'<p>'+esc(g.description)+'</p>':"");
  if(!mine){const rq=cl.myreq[id];h+=rq==="pending"?'<span class="chip">⏳ طلبك بانتظار الموافقة</span>':'<button class="primary" onclick="joinGroup(\''+esc(id)+'\')">'+(p==="public"?"انضمام للجروب":"طلب انضمام")+'</button>'}
  else h+='<div class="chips"><button class="chip" onclick="gInviteCopy(\''+esc(id)+'\')">🔗 دعوة</button><button class="chip" onclick="leaveGroup()">🚪 خروج</button>'+(g.owner!==gMe()?'<button class="chip" onclick="reportItem(\'group\',\''+esc(id)+'\')">🚩 إبلاغ</button>':"")+'</div>';
  h+='</div><div class="seg">'+[["posts","📰 المنشورات"],["chat","💬 الشات"],["members","👥 الأعضاء"],["about","ℹ️ حول"]].concat(mod?[["manage","🛠️ إدارة"+(pend?" ("+an(pend)+")":"")]]:[]).map(a=>'<button class="'+(tab===a[0]?"on":"")+'" onclick="setTab(\''+a[0]+'\')">'+a[1]+'</button>').join("")+'</div>';
  if(tab==="chat"){if(!mine)return h+'<div class="card empty">انضم للجروب عشان تشوف الشات</div>';const oh=_oldGroup.render(e)+"",i=oh.indexOf('class="seg"'),j=oh.indexOf("</div>",i)+6;return h+oh.slice(j)}
  if(tab==="members")return h+gMembersHtml(id);
  if(tab==="about")return h+gAboutHtml(id);
  if(tab==="manage"&&mod)return h+gManageHtml(id);
  return h+gPostsHtml(id,mine);
},after:e=>{
  if(!cs()||!e)return;
  if(!cl.gx[e.id])gLoad(e.id);else x2draw(e.id);
  if("chat"===cl.tab&&cl.mine[e.id])_oldGroup.after&&_oldGroup.after(e);else try{chatCloseLive()}catch(_){}
}};
function gAvatarName(uid){const p=cl.pp[uid]||{};return esc(p.name||"مستخدم")}
function gPostsHtml(id,mine){
  const x=cl.gx[id],mod=gIsMod(id),me=gMe(),g=(cl.groups||[]).find(g=>g.id===id),set=cl.gset[id]||{};
  let h="";
  if(mine)h+='<div class="card"><textarea id="pBody" class="input" rows="3" maxlength="1000" placeholder="اكتب منشورًا للجروب… (@اسم_المستخدم للإشارة)" aria-label="منشور"></textarea><div id="gpPrev" class="gprev"></div><div style="display:flex;gap:8px;margin-top:8px;align-items:center"><label class="pact" style="cursor:pointer">📷 صور<input type="file" accept="image/*" multiple hidden onchange="gPickImgs(this)"></label><button class="primary" style="flex:1" onclick="gSendPost()">نشر</button></div>'+(set.post_approval&&!mod?'<p class="muted" style="font-size:12px">منشوراتك بتتراجع من المشرف قبل ما تظهر.</p>':"")+'</div>';
  const list=(x.posts||[]).filter(p=>p.status==="published"||p.user_id===me||mod).slice().sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
  if(!list.length)return h+'<div class="card empty">'+(mine?"لسه مفيش منشورات، اكتب أول منشور.":"مفيش منشورات ظاهرة. "+(gPriv(id)==="public"?"":"المنشورات للأعضاء فقط."))+'</div>';
  return h+list.map(p=>{
    const a=cl.pp[p.user_id]||{id:p.user_id,name:(p.profiles&&p.profiles.name)||""},own=p.user_id===me,l=fd.lk[p.id]||{n:0,me:!1},imgs=(x.imgs[p.id]||[]).filter(imgOk).slice(0,6);
    return '<div class="card fpost" data-id="'+esc(p.id)+'"><div class="fh"><span role="button" tabindex="0" onclick="openUser(\''+esc(p.user_id)+'\')">'+avHtml(a,40)+'</span><div class="fhn"><b role="button" tabindex="0" onclick="openUser(\''+esc(p.user_id)+'\')">'+esc(a.name||"مستخدم")+vfMark(a)+'</b><small>'+agoAr(p.created_at)+(p.pinned?" · 📌 مثبّت":"")+(p.status==="pending"?" · ⏳ بانتظار الموافقة":"")+'</small></div>'+
      (own||mod?'<button class="pact" aria-label="حذف" onclick="delPost(\''+esc(p.id)+'\');setTimeout(()=>gLoad(\''+esc(id)+'\'),600)">🗑</button>':'<button class="pact" aria-label="إبلاغ" onclick="reportItem(\'post\',\''+esc(p.id)+'\')">🚩</button>')+
      (mod&&p.status==="published"?'<button class="pact" aria-label="تثبيت" onclick="gPin(\''+esc(id)+'\',\''+esc(p.id)+'\','+(!p.pinned)+')">'+(p.pinned?"📍":"📌")+'</button>':"")+'</div>'+
      '<p style="white-space:pre-wrap">'+esc(p.body)+'</p>'+(imgs.length?'<div class="fimgs">'+imgs.map(u=>'<img loading="lazy" src="'+esc(u)+'" alt="صورة" onclick="dmZoom(this.src)">').join("")+'</div>':"")+
      (p.status==="pending"&&mod?'<div class="chips"><button class="chip on" onclick="gApprove(\''+esc(id)+'\',\''+esc(p.id)+'\',true)">✅ موافقة</button><button class="chip" onclick="gApprove(\''+esc(id)+'\',\''+esc(p.id)+'\',false)">❌ رفض</button></div>':
      (p.status==="published"?'<div class="fact"><button class="eb'+(l.me?" on":"")+'" id="lk-'+esc(p.id)+'" onclick="likeToggle(\''+esc(p.id)+'\')">👍 <span>'+an(l.n)+'</span> أعجبني</button><button class="eb" onclick="cmToggle(\''+esc(p.id)+'\')">💬 <span id="cmn-'+esc(p.id)+'">'+an(fd.cc[p.id]||0)+'</span> تعليق</button></div><div id="cm-'+esc(p.id)+'" class="cmbox hide"></div>':""))+'</div>';
  }).join("");
}
window._gImgs=[];
async function gImgData(f){const b=await createImageBitmap(f),k=Math.min(1,1280/Math.max(b.width,b.height)),c=document.createElement("canvas");c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext("2d").drawImage(b,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.82)}
async function gPickImgs(inp){
  const fs=[...(inp.files||[])].slice(0,Math.max(0,4-window._gImgs.length));inp.value="";
  for(const f of fs){if(!/^image\//.test(f.type))continue;try{window._gImgs.push(await gImgData(f))}catch(e){}}
  const pv=el("gpPrev");pv&&(pv.innerHTML=window._gImgs.map((u,i)=>'<span class="gpi"><img src="'+u+'" alt=""><button type="button" onclick="window._gImgs.splice('+i+',1);gPickImgs({files:[],value:\'\'})">×</button></span>').join(""));
}
async function gSendPost(){
  if(banStop())return;const g=curGroup(),t=val("pBody");if(!g)return;if(!t&&!window._gImgs.length)return msg("اكتب المنشور");
  try{
    const r=await sb("/rest/v1/posts",{method:"POST",prefer:"return=representation",body:{group_id:g.id,body:t||"📷"}}),pid=r&&r[0]&&r[0].id;
    if(pid&&window._gImgs.length){for(const d of window._gImgs){const u=await upImg(d);if(u&&u.startsWith("https://"))await sb("/rest/v1/group_post_images",{method:"POST",prefer:"return=minimal",body:{post_id:pid,url:u}}).catch(()=>{})}}
    window._gImgs=[];el("pBody")&&(el("pBody").value="");
    const pend=r&&r[0]&&r[0].status==="pending";msg(pend?"اتبعت للمراجعة ✅":"تم النشر");await gLoad(g.id);
  }catch(e){msg(sbErr(e).slice(0,100))}
}
async function gPin(gid,pid,val){try{await sb("/rest/v1/posts?id=eq."+pid,{method:"PATCH",prefer:"return=minimal",body:{pinned:val}});await gLoad(gid)}catch(e){msg(sbErr(e).slice(0,80))}}
async function gApprove(gid,pid,ok){
  try{if(ok)await sb("/rest/v1/posts?id=eq."+pid,{method:"PATCH",prefer:"return=minimal",body:{status:"published"}});else await delRow("/rest/v1/posts?id=eq."+pid);await gLoad(gid)}catch(e){msg(sbErr(e).slice(0,80))}
}
function gMembersHtml(id){
  const x=cl.gx[id],me=gMe(),admin=gIsAdmin(id),g=(cl.groups||[]).find(g=>g.id===id);
  const rl={};(x.admins||[]).forEach(a=>rl[a.user_id]=a.role);if(g)rl[g.owner]="owner";
  const ord={owner:0,admin:1,moderator:2,"":3};
  const list=(x.members||[]).slice().sort((a,b)=>ord[rl[a.user_id]||""]-ord[rl[b.user_id]||""]);
  return '<div class="card">'+list.map(m=>{const p=cl.pp[m.user_id]||{id:m.user_id,name:""},r=rl[m.user_id]||"";
    return '<div class="cmt" style="align-items:center"><span onclick="openUser(\''+esc(m.user_id)+'\')">'+avHtml(p,38)+'</span><b style="flex:1" onclick="openUser(\''+esc(m.user_id)+'\')">'+esc(p.name||"مستخدم")+vfMark(p)+(r?' <span class="pill">'+(r==="owner"?"👑 مالك":r==="admin"?"🛡️ مشرف":"🔧 مراقب")+'</span>':"")+'</b>'+((gIsMod(id)||admin)&&m.user_id!==me&&r!=="owner"?'<button class="pact" onclick="gMemberMenu(\''+esc(id)+'\',\''+esc(m.user_id)+'\')">⋯</button>':"")+'</div>'}).join("")+'</div>';
}
function gMemberMenu(id,uid){
  const owner=gRole(id)==="owner"||gRole(id)==="super",admin=gIsAdmin(id),r=((cl.gx[id].admins||[]).find(a=>a.user_id===uid)||{}).role||"",p=cl.pp[uid]||{};
  const q="\\'"+id+"\\',\\'"+uid+"\\'";
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>'+esc(p.name||"عضو")+'</h3><div class="dmsheet"><button class="chip" onclick="closeModal();openUser(\''+uid+'\')">👤 البروفايل</button>'+
    (owner?(r?'<button class="chip" onclick="gSetRole('+q+',\'\')">إزالة الصلاحية</button>':"")+(r!=="admin"?'<button class="chip" onclick="gSetRole('+q+',\'admin\')">🛡️ تعيين مشرف</button>':"")+(r!=="moderator"?'<button class="chip" onclick="gSetRole('+q+',\'moderator\')">🔧 تعيين مراقب</button>':""):"")+
    (admin&&(!r||owner)?'<button class="chip" onclick="gRemoveMember('+q+')">🚪 إزالة من الجروب</button><button class="chip" onclick="gBan('+q+',\'mute\',1)">🔇 كتم 24 ساعة</button><button class="chip" onclick="gBan('+q+',\'ban\',1)">⛔ حظر 24 ساعة</button><button class="chip" onclick="gBan('+q+',\'ban\',0)">⛔ حظر دائم</button>':"")+'</div>');
}
async function gSetRole(id,uid,role){
  closeModal();try{
    await delRow("/rest/v1/group_admins?group_id=eq."+id+"&user_id=eq."+uid).catch(()=>{});
    if(role)await sb("/rest/v1/group_admins",{method:"POST",prefer:"return=minimal",body:{group_id:id,user_id:uid,role}});
    msg("تم ✅");await gLoad(id)}catch(e){msg(sbErr(e).slice(0,90))}
}
async function gRemoveMember(id,uid){closeModal();if(!confirm("إزالة العضو من الجروب؟"))return;try{await delRow("/rest/v1/group_members?group_id=eq."+id+"&user_id=eq."+uid);msg("تمت الإزالة");await gLoad(id)}catch(e){msg(sbErr(e).slice(0,90))}}
async function gBan(id,uid,kind,day){
  closeModal();if(!confirm(kind==="ban"?"حظر العضو؟":"كتم العضو لمدة 24 ساعة؟"))return;
  try{await sb("/rest/v1/group_bans?on_conflict=group_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{group_id:id,user_id:uid,kind,until:day?new Date(Date.now()+864e5).toISOString():null}});msg("تم ✅");await gLoad(id)}catch(e){msg(sbErr(e).slice(0,90))}
}
async function gUnban(id,uid){try{await delRow("/rest/v1/group_bans?group_id=eq."+id+"&user_id=eq."+uid);await gLoad(id)}catch(e){msg(sbErr(e).slice(0,80))}}
function gAboutHtml(id){
  const g=(cl.groups||[]).find(g=>g.id===id),set=cl.gset[id]||{},p=gPriv(id),t=GT[p]||GT.public,admin=gIsAdmin(id);
  let h='<div class="card"><b>عن الجروب</b><p>'+(g.description?esc(g.description):'<span class="muted">لا يوجد وصف</span>')+'</p><div class="muted">'+t[0]+' <b>'+t[1]+'</b> — '+t[2]+'</div></div>';
  h+='<div class="card"><b>📜 قواعد الجروب</b><p style="white-space:pre-wrap">'+(set.rules?esc(set.rules):'<span class="muted">لم تتم كتابة قواعد بعد</span>')+'</p></div>';
  if(cl.mine[id])h+='<div class="card"><b>🔗 رابط الدعوة</b><p class="muted" style="overflow-wrap:anywhere">'+esc(gInviteUrl(id))+'</p><button class="secondary" onclick="gInviteCopy(\''+esc(id)+'\')">نسخ الرابط</button></div>';
  if(admin)h+='<button class="primary" onclick="gEdit(\''+esc(id)+'\')">⚙️ إعدادات الجروب</button>';
  if(gRole(id)==="owner"||cl.admin)h+='<button class="secondary" style="margin-top:8px" onclick="delGroup()">🗑 حذف الجروب</button>';
  return h;
}
function gManageHtml(id){
  const x=cl.gx[id];let h="";
  const rq=x.reqs||[],pn=(x.posts||[]).filter(p=>p.status==="pending"),bn=x.bans||[];
  h+='<div class="card"><b>🙋 طلبات الانضمام ('+an(rq.length)+')</b>'+(rq.length?rq.map(r=>{const p=cl.pp[r.user_id]||{id:r.user_id,name:""};return '<div class="cmt" style="align-items:center">'+avHtml(p,36)+'<b style="flex:1">'+esc(p.name||"مستخدم")+'</b><button class="chip on" onclick="gReq(\''+esc(id)+'\','+r.id+',true)">قبول</button><button class="chip" onclick="gReq(\''+esc(id)+'\','+r.id+',false)">رفض</button></div>'}).join(""):'<p class="muted">لا توجد طلبات</p>')+'</div>';
  h+='<div class="card"><b>⏳ منشورات بانتظار الموافقة ('+an(pn.length)+')</b>'+(pn.length?pn.map(p=>'<div class="cmt" style="align-items:center"><span style="flex:1">'+gAvatarName(p.user_id)+': '+esc((p.body||"").slice(0,80))+'</span><button class="chip on" onclick="gApprove(\''+esc(id)+'\',\''+esc(p.id)+'\',true)">نشر</button><button class="chip" onclick="gApprove(\''+esc(id)+'\',\''+esc(p.id)+'\',false)">رفض</button></div>').join(""):'<p class="muted">لا توجد منشورات معلّقة</p>')+'</div>';
  h+='<div class="card"><b>⛔ المحظورون والمكتومون ('+an(bn.length)+')</b>'+(bn.length?bn.map(b=>'<div class="cmt" style="align-items:center"><span style="flex:1">'+gAvatarName(b.user_id)+' <span class="pill">'+(b.kind==="ban"?"محظور":"مكتوم")+'</span></span>'+(gIsAdmin(id)?'<button class="chip" onclick="gUnban(\''+esc(id)+'\',\''+esc(b.user_id)+'\')">رفع</button>':"")+'</div>').join(""):'<p class="muted">لا أحد</p>')+'</div>';
  return h;
}
async function gReq(id,rid,ok){
  try{await sb("/rest/v1/group_join_requests?id=eq."+rid,{method:"PATCH",prefer:"return=minimal",body:{status:ok?"approved":"rejected"}});msg(ok?"تم القبول، هيدخل الجروب أول ما يفتح التطبيق":"تم الرفض");await gLoad(id)}catch(e){msg(sbErr(e).slice(0,90))}
}
function gEdit(id){
  const g=(cl.groups||[]).find(g=>g.id===id),set=cl.gset[id]||{},p=gPriv(id);
  formModal("إعدادات الجروب",inp("geN","اسم الجروب",g.name,{max:60})+inp("geD","الوصف",g.description||"",{area:1,max:300,rows:3})+
    '<label class="lbl">نوع الجروب</label><select id="geT" class="input">'+Object.keys(GT).map(k=>'<option value="'+k+'"'+(k===p?" selected":"")+'>'+GT[k][0]+" "+GT[k][1]+'</option>').join("")+'</select>'+
    inp("geR","القواعد",set.rules||"",{area:1,max:1500,rows:4})+'<label class="chkrow"><input id="geA" type="checkbox"'+(set.post_approval?" checked":"")+'> المنشورات تحتاج موافقة</label>'+
    '<label class="lbl">صورة الغلاف</label><input id="geC" type="file" accept="image/*">',()=>(gSaveEdit(id),!1),{save:"حفظ"});
}
async function gSaveEdit(id){
  const n=val("geN");if(n.length<2)return msg("اكتب اسم الجروب");
  try{
    await sb("/rest/v1/groups?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{name:n.slice(0,60),description:val("geD").slice(0,300)}});
    const body={group_id:id,privacy:el("geT").value,rules:val("geR")||null,post_approval:!!el("geA").checked};
    const f=el("geC")&&el("geC").files&&el("geC").files[0];
    if(f){const u=await upImg(await gImgData(f));if(u&&u.startsWith("https://"))body.cover_url=u}
    await sb("/rest/v1/group_settings?on_conflict=group_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body});
    closeModal();cl.groups=null;cl.conv=!1;cl.gx[id]=null;msg("تم الحفظ ✅");
    const g=curGroup();g&&(g.name=n);loadConv().then(()=>{gLoad(id)})
  }catch(e){msg(sbErr(e).slice(0,100))}
}
/* invite links: https://yomak-app.github.io/?g=<group id> */
const gInviteUrl=id=>location.origin+location.pathname+"?g="+id;
function gInviteCopy(id){const u=gInviteUrl(id),t="انضم لجروبنا على يومك: "+u;try{if(navigator.share)return void navigator.share({text:t}).catch(()=>{})}catch(e){}copyText(t)}
async function gInviteBoot(){
  let id=null;try{id=new URLSearchParams(location.search).get("g")||localStorage.getItem("yomak_g")}catch(e){}
  if(!id||!UUID_RE.test(id))return;
  if(!cs()){try{localStorage.setItem("yomak_g",id)}catch(e){}return}
  try{localStorage.removeItem("yomak_g")}catch(e){}
  try{history.replaceState(null,"",location.pathname)}catch(e){}
  try{
    const r=await sbRaw("/rest/v1/rpc/group_preview",{method:"POST",body:{gid:id},token:cs().access});
    if(!r||!r.id)return msg("الجروب غير متاح");
    const t=GT[r.privacy]||GT.public;
    openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>دعوة لجروب</h3><b>'+esc(r.name)+'</b><div class="muted">'+t[0]+' '+t[1]+' · '+an(r.members)+' عضو</div><p>'+esc(r.description||"")+'</p><button class="primary" onclick="closeModal();gJoinInvite(\''+esc(r.id)+'\',\''+esc(r.privacy)+'\')">'+(r.privacy==="public"?"انضمام":"طلب انضمام")+'</button>');
  }catch(e){}
}
async function gJoinInvite(id,p){cl.gset[id]=Object.assign(cl.gset[id]||{},{privacy:p});await joinGroup(id);cl.groups=null;cl.conv=!1;try{await loadConv()}catch(e){}}
setTimeout(gInviteBoot,2500);setInterval(()=>{try{if(localStorage.getItem("yomak_g")&&cs())gInviteBoot()}catch(e){}},5000);
(function(){const s=document.createElement("style");s.textContent=".gcover{height:120px;border-radius:14px;background:linear-gradient(135deg,#123c3a,#3f8f84) center/cover}.gprev{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.gpi{position:relative}.gpi img{width:70px;height:70px;object-fit:cover;border-radius:8px}.gpi button{position:absolute;top:-6px;inset-inline-start:-6px;border:0;border-radius:50%;background:#d32f2f;color:#fff;width:20px;height:20px}.fimgs{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:4px;margin:6px 0}.fimgs img{width:100%;height:140px;object-fit:cover;border-radius:10px}";document.head.appendChild(s)})();
