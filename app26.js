/* Phase 4D2: Pages like Facebook: create, follow, post as page, reviews, page messages, admins, report. */
cl.pg=cl.pg||{list:[],my:{},fol:{},x:{}};
const _gl2=window.gListHtml;
window.gListHtml=function(){return '<div class="card" onclick="openPage(\'pages\')" style="cursor:pointer"><b>📄 الصفحات</b><p class="muted">تابع صفحات المحلات والشخصيات، أو أنشئ صفحتك.</p></div>'+_gl2.apply(this,arguments)};
const pgMe=()=>(cs()||{}).uid;
const pgStars=n=>"★★★★★".slice(0,Math.round(n))+"☆☆☆☆☆".slice(0,5-Math.round(n));
const PGCAT=["محل / نشاط تجاري","مطعم","شخصية عامة","مجتمع","خدمات","تعليم","أخرى"];
async function pgLoadList(){
  const u=pgMe();
  try{
    const[l,f,a]=await Promise.all([sb("/rest/v1/pages?select=*&order=followers_count.desc&limit=100"),u?sb("/rest/v1/page_follows?select=page_id&user_id=eq."+u):[],u?sb("/rest/v1/page_admins?select=page_id&user_id=eq."+u):[]]);
    cl.pg.list=l||[];cl.pg.fol={};(f||[]).forEach(x=>cl.pg.fol[x.page_id]=1);cl.pg.my={};(a||[]).forEach(x=>cl.pg.my[x.page_id]=1);
    cl.pg.list.forEach(p=>{if(p.owner===u)cl.pg.my[p.id]=1});
  }catch(e){cl.pg.err=sbErr(e)}
  if(curPage()==="pages")renderPage();
}
PAGES.pages={title:()=>"الصفحات",render:()=>{
  if(!cs())return authCard();
  if(!cl.pg.loaded){cl.pg.loaded=1;pgLoadList()}
  const q=norm(cl.pg.q||"");
  const L=cl.pg.list.filter(p=>!q||norm(p.name+" "+(p.category||"")).includes(q));
  return '<button class="primary" onclick="pgForm()">＋ إنشاء صفحة</button><input class="input" placeholder="ابحث عن صفحة" value="'+esc(cl.pg.q||"")+'" oninput="cl.pg.q=this.value;renderPage()">'+
   (L.length?L.map(p=>'<div class="card" onclick="openPage(\'pagev\',{id:'+p.id+'})" style="cursor:pointer"><div class="row">'+pgAv(p)+'<div><b>'+esc(p.name)+'</b><div class="muted">'+esc(p.category||"")+' · '+an(p.followers_count||0)+' متابع</div></div></div></div>').join(""):'<div class="card empty">مفيش صفحات لسه</div>');
}};
function pgAv(p,s){s=s||44;return p.photo&&imgOk(p.photo)?'<img class="av" style="width:'+s+'px;height:'+s+'px" src="'+esc(p.photo)+'" alt="">':'<span class="av" style="width:'+s+'px;height:'+s+'px">'+esc((p.name||"?").slice(0,1))+'</span>'}
function pgForm(p){
  p=p||{};
  formModal(p.id?"تعديل الصفحة":"إنشاء صفحة",inp("pgName","اسم الصفحة",p.name||"",{max:60})+'<label class="lbl">التصنيف</label><select id="pgCat" class="input">'+PGCAT.map(c=>'<option'+(c===p.category?" selected":"")+'>'+c+'</option>').join("")+'</select>'+inp("pgAbout","نبذة",p.about||"",{area:1,max:800,rows:3})+inp("pgPhone","رقم الهاتف / واتساب",p.phone||"",{max:20,type:"tel"})+inp("pgWeb","الموقع",p.website||"",{max:120})+inp("pgMail","البريد",p.email||"",{max:80})+inp("pgAddr","العنوان",p.address||"",{max:150})+
   '<label class="lbl">صورة الصفحة</label><input id="pgPh" type="file" accept="image/*" class="input"><label class="lbl">صورة الغلاف</label><input id="pgCv" type="file" accept="image/*" class="input">',()=>(pgSave(p.id),!1),{save:p.id?"حفظ":"إنشاء"});
}
async function pgSave(id){
  if(banStop())return;const name=(val("pgName")||"").trim();if(!name)return msg("اكتب اسم الصفحة");
  const b={name,category:val("pgCat"),about:val("pgAbout"),phone:val("pgPhone"),website:val("pgWeb"),email:val("pgMail"),address:val("pgAddr")};
  try{
    for(const[k,i]of[["photo","pgPh"],["cover","pgCv"]]){const f=el(i)&&el(i).files[0];if(f){const u=await upImg(await gImgData(f));if(u&&u.startsWith("https://"))b[k]=u}}
    if(id)await sb("/rest/v1/pages?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:b});
    else{await ensureProfile();b.owner=pgMe();await sb("/rest/v1/pages",{method:"POST",prefer:"return=minimal",body:b})}
    closeModal();msg("تم ✅");cl.pg.x={};await pgLoadList();
  }catch(e){msg(sbErr(e))}
}
async function pgLoad(id){
  const u=pgMe();
  try{
    const[pg,po,rv,ad]=await Promise.all([sb("/rest/v1/pages?select=*&id=eq."+id),sb("/rest/v1/page_posts?select=*&page_id=eq."+id+"&order=created_at.desc&limit=50"),sb("/rest/v1/page_reviews?select=*&page_id=eq."+id+"&order=created_at.desc&limit=50"),sb("/rest/v1/page_admins?select=user_id,role&page_id=eq."+id)]);
    const x={page:(pg||[])[0],posts:po||[],revs:rv||[],admins:ad||[]};
    await loadPeople(x.revs.map(r=>r.user_id).concat(x.admins.map(a=>a.user_id)));
    if(x.page&&u){const f=await sb("/rest/v1/page_follows?select=page_id&page_id=eq."+id+"&user_id=eq."+u);cl.pg.fol[id]=(f||[]).length?1:0}
    cl.pg.x[id]=x;
  }catch(e){cl.pg.x[id]={err:sbErr(e)}}
  if(curPage()==="pagev")renderPage();
}
const pgAdm=id=>{const x=cl.pg.x[id];if(!x||!x.page)return false;const u=pgMe();return x.page.owner===u||x.admins.some(a=>a.user_id===u)||!!cl.admin};
PAGES.pagev={title:e=>esc(((cl.pg.x[e&&e.id]||{}).page||{}).name||"صفحة"),render:e=>{
  if(!cs())return authCard();const id=e&&e.id,x=cl.pg.x[id];
  if(!x){pgLoad(id);return '<p class="muted">جاري التحميل…</p>'}
  if(x.err||!x.page)return '<div class="card empty">'+esc(x.err||"الصفحة غير متاحة")+'</div>';
  const p=x.page,adm=pgAdm(id),own=p.owner===pgMe()||!!cl.admin,tab=cl.pg.tab||"posts";
  const avg=x.revs.length?x.revs.reduce((s,r)=>s+r.rating,0)/x.revs.length:0;
  let h='<div class="gcover" style="'+(p.cover&&imgOk(p.cover)?'background-image:url('+esc(p.cover)+')':'')+'"></div><div class="card" style="margin-top:-24px;position:relative"><div class="row">'+pgAv(p,56)+'<div><b style="font-size:18px">'+esc(p.name)+'</b><div class="muted">'+esc(p.category||"")+' · '+an(p.followers_count||0)+' متابع'+(x.revs.length?' · '+pgStars(avg)+' ('+an(x.revs.length)+')':"")+'</div></div></div>'+(p.about?'<p>'+esc(p.about)+'</p>':"");
  h+='<div class="chips"><button class="chip '+(cl.pg.fol[id]?"on":"")+'" onclick="pgFollow('+id+')">'+(cl.pg.fol[id]?"✓ متابَع":"＋ متابعة")+'</button><button class="chip" onclick="pgSetTab(\'msg\')">💬 رسالة</button>'+(p.phone?'<a class="chip" href="tel:'+esc(p.phone)+'">📞 اتصال</a><a class="chip" href="https://wa.me/'+esc(p.phone.replace(/\D/g,""))+'" target="_blank" rel="noopener">واتساب</a>':"")+(p.website&&/^https?:\/\//.test(p.website)?'<a class="chip" href="'+esc(p.website)+'" target="_blank" rel="noopener">🌐 الموقع</a>':"")+(p.email?'<a class="chip" href="mailto:'+esc(p.email)+'">✉️</a>':"")+(adm?'<button class="chip" onclick="pgForm(cl.pg.x['+id+'].page)">✏️ تعديل</button>':'<button class="chip" onclick="pgReport(\'page\','+id+')">🚩 إبلاغ</button>')+(own?'<button class="chip" onclick="pgDelPage('+id+')">🗑 حذف الصفحة</button>':"")+'</div></div>';
  h+='<div class="seg">'+[["posts","📰 المنشورات"],["rev","⭐ التقييمات"],["about","ℹ️ حول"],["msg","💬 الرسائل"]].map(a=>'<button class="'+(tab===a[0]?"on":"")+'" onclick="pgSetTab(\''+a[0]+'\')">'+a[1]+'</button>').join("")+'</div>';
  if(tab==="posts"){
    if(adm)h+='<div class="card"><textarea id="ppBody" class="input" rows="3" maxlength="2000" placeholder="انشر باسم الصفحة"></textarea><input id="ppImg" type="file" accept="image/*" class="input"><button class="primary" onclick="pgPost('+id+')">نشر</button></div>';
    h+=x.posts.length?x.posts.map(q=>'<div class="card fpost"><div class="fh">'+pgAv(p,38)+'<div class="fhn"><b>'+esc(p.name)+'</b><small>'+esc(new Date(q.created_at).toLocaleString("ar-EG"))+'</small></div>'+(adm?'<button class="chip" onclick="pgDelPost('+q.id+','+id+')">🗑</button>':'<button class="chip" onclick="pgReport(\'page_post\','+q.id+')">🚩</button>')+'</div><div class="fb">'+esc(q.body||"")+'</div>'+(q.image&&imgOk(q.image)?'<img class="fimg" src="'+esc(q.image)+'" alt="">':"")+'</div>').join(""):'<div class="card empty">مفيش منشورات</div>';
  }else if(tab==="rev"){
    const mine=x.revs.find(r=>r.user_id===pgMe());
    h+='<div class="card"><label class="lbl">تقييمك</label><select id="rvR" class="input">'+[5,4,3,2,1].map(n=>'<option value="'+n+'"'+(mine&&mine.rating===n?" selected":"")+'>'+pgStars(n)+'</option>').join("")+'</select><textarea id="rvB" class="input" rows="2" maxlength="500" placeholder="رأيك (اختياري)">'+esc(mine&&mine.body||"")+'</textarea><button class="primary" onclick="pgReview('+id+')">'+(mine?"تحديث تقييمي":"أضف تقييم")+'</button></div>';
    h+=x.revs.map(r=>'<div class="card"><b>'+esc(pName(r.user_id))+'</b> <span class="price">'+pgStars(r.rating)+'</span><p>'+esc(r.body||"")+'</p>'+(r.user_id===pgMe()||adm?'<button class="chip" onclick="pgDelRev('+id+',\''+r.user_id+'\')">🗑</button>':"")+'</div>').join("");
  }else if(tab==="about"){
    h+='<div class="card"><p>'+esc(p.about||"لا توجد نبذة")+'</p>'+(p.address?'<p>📍 '+esc(p.address)+'</p>':"")+(p.phone?'<p>📞 '+esc(p.phone)+'</p>':"")+'</div>';
    if(own)h+='<div class="card"><b>المشرفون</b>'+x.admins.map(a=>'<div class="row between"><span>'+esc(pName(a.user_id))+'</span><button class="chip" onclick="pgRmAdmin('+id+',\''+a.user_id+'\')">إزالة</button></div>').join("")+'<input id="pgAdmQ" class="input" placeholder="اكتب اسم المستخدم لإضافته كمشرف"><button class="secondary" onclick="pgAddAdmin('+id+')">إضافة مشرف</button></div>';
  }else{
    h+='<div id="pgMsgs" class="msgs"><p class="muted">جاري التحميل…</p></div><div class="row"><input id="pmB" class="input" placeholder="اكتب رسالة" maxlength="1000"><button class="pact" onclick="pgSend('+id+')">إرسال</button></div>';
    setTimeout(()=>pgMsgs(id),0);
  }
  return h;
}};
const pName=uid=>{try{return(cl.pp&&cl.pp[uid]&&cl.pp[uid].name)||"مستخدم"}catch(e){return"مستخدم"}};
function pgSetTab(t){cl.pg.tab=t;renderPage()}
async function pgFollow(id){
  if(banStop())return;try{
    if(cl.pg.fol[id])await sb("/rest/v1/page_follows?page_id=eq."+id+"&user_id=eq."+pgMe(),{method:"DELETE",prefer:"return=minimal"});
    else{await ensureProfile();await sb("/rest/v1/page_follows",{method:"POST",prefer:"return=minimal",body:{page_id:id,user_id:pgMe()}})}
    await pgLoad(id);
  }catch(e){msg(sbErr(e))}
}
async function pgPost(id){
  const t=(val("ppBody")||"").trim(),f=el("ppImg")&&el("ppImg").files[0];if(!t&&!f)return msg("اكتب المنشور");
  try{let img=null;if(f){const u=await upImg(await gImgData(f));if(u&&u.startsWith("https://"))img=u}
    await sb("/rest/v1/page_posts",{method:"POST",prefer:"return=minimal",body:{page_id:id,author:pgMe(),body:t,image:img}});await pgLoad(id);msg("تم النشر ✅")}catch(e){msg(sbErr(e))}
}
async function pgDelPost(pid,id){if(!confirm("حذف المنشور؟"))return;try{await sb("/rest/v1/page_posts?id=eq."+pid,{method:"DELETE",prefer:"return=minimal"});await pgLoad(id)}catch(e){msg(sbErr(e))}}
async function pgReview(id){
  try{await ensureProfile();await sb("/rest/v1/page_reviews?on_conflict=page_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{page_id:id,user_id:pgMe(),rating:+val("rvR"),body:val("rvB")}});await pgLoad(id);msg("تم ✅")}catch(e){msg(sbErr(e))}
}
async function pgDelRev(id,uid){try{await sb("/rest/v1/page_reviews?page_id=eq."+id+"&user_id=eq."+uid,{method:"DELETE",prefer:"return=minimal"});await pgLoad(id)}catch(e){msg(sbErr(e))}}
async function pgDelPage(id){if(!confirm("حذف الصفحة نهائيًا؟"))return;try{await sb("/rest/v1/pages?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});cl.pg.loaded=0;cl.pg.x={};backBtn();msg("تم الحذف")}catch(e){msg(sbErr(e))}}
async function pgAddAdmin(id){
  const q=(val("pgAdmQ")||"").trim();if(!q)return;
  try{const r=await sb("/rest/v1/profiles?select=id,name&name=ilike."+encodeURIComponent(q)+"&limit=1");if(!r||!r[0])return msg("مفيش مستخدم بالاسم ده");
    await sb("/rest/v1/page_admins",{method:"POST",prefer:"return=minimal",body:{page_id:id,user_id:r[0].id}});await pgLoad(id);msg("تمت الإضافة ✅")}catch(e){msg(sbErr(e))}
}
async function pgRmAdmin(id,uid){try{await sb("/rest/v1/page_admins?page_id=eq."+id+"&user_id=eq."+uid,{method:"DELETE",prefer:"return=minimal"});await pgLoad(id)}catch(e){msg(sbErr(e))}}
async function pgMsgs(id){
  const box=el("pgMsgs");if(!box)return;const x=cl.pg.x[id],adm=pgAdm(id);
  try{
    let q="/rest/v1/page_messages?select=*&page_id=eq."+id+"&order=created_at.asc&limit=200";if(!adm)q+="&user_id=eq."+pgMe();
    const m=await sb(q);await loadPeople((m||[]).map(r=>r.user_id));
    box.innerHTML=(m||[]).length?m.map(r=>{const mine=adm?r.from_page:!r.from_page;return '<div class="mrow '+(mine?"me":"")+'"><div class="bub '+(mine?"me":"")+'"><span class="sn">'+esc(r.from_page?x.page.name:pName(r.user_id))+'</span>'+esc(r.body)+'</div></div>'}).join(""):'<p class="muted">ابدأ المحادثة مع الصفحة</p>';
    box.scrollTop=box.scrollHeight;
  }catch(e){box.innerHTML='<p class="muted">'+esc(sbErr(e))+'</p>'}
}
async function pgSend(id){
  const t=(val("pmB")||"").trim();if(!t)return;const adm=pgAdm(id)&&pgMe()!==undefined&&(cl.pg.x[id].page.owner===pgMe()||cl.pg.x[id].admins.some(a=>a.user_id===pgMe()));
  let uid=pgMe();
  if(adm){uid=cl.pg.replyTo;if(!uid){const last=await sb("/rest/v1/page_messages?select=user_id&page_id=eq."+id+"&from_page=eq.false&order=created_at.desc&limit=1");uid=last&&last[0]&&last[0].user_id;if(!uid)return msg("مفيش عميل ترد عليه")}}
  try{await sb("/rest/v1/page_messages",{method:"POST",prefer:"return=minimal",body:{page_id:id,user_id:uid,from_page:!!adm,body:t}});el("pmB").value="";pgMsgs(id)}catch(e){msg(sbErr(e))}
}
function pgReport(kind,id){reportItem(kind,id)}
