/* Phase 4E3: save posts, share, audience, hashtags, global search. */
cl.sv={set:{},loaded:0};
async function svLoad(){const u=(cs()||{}).uid;if(!u)return;try{const r=await sb("/rest/v1/saved_posts?select=post_id,kind&limit=500");cl.sv.set={};(r||[]).forEach(x=>cl.sv.set[x.post_id]=x.kind);cl.sv.loaded=1}catch(e){cl.sv.loaded=1}}
const _sc=window.svcCard;
const tagLink=h=>h.replace(/(^|[\s>])#([\p{L}\p{N}_]{2,30})/gu,(m,a,t)=>a+'<a href="#" style="color:var(--g);font-weight:700" onclick="openPage(\'tag\',{t:\''+t+'\'});return false">#'+t+'</a>').replace(/(^|[\s>])@([\p{L}\p{N}_]{2,30})/gu,(m,a,t)=>a+'<a href="#" style="color:var(--g);font-weight:700" onclick="srchGo(\''+t+'\');return false">@'+t+'</a>');
window.svcCard=function(e){
  let h=_sc.apply(this,arguments)+"";
  if(!cl.sv.loaded){cl.sv.loaded=1;svLoad()}
  h=h.replace(/(<p class="fb">)([\s\S]*?)(<\/p>)/,(m,a,b,c)=>a+tagLink(b)+c);
  const id=e.id,sv=!!cl.sv.set[id],mine=(cs()||{}).uid===e.user_id;
  const row='<div class="fact"><button class="fb-call" onclick="svToggle(\''+id+'\')">'+(sv?"🔖 محفوظ":"🔖 حفظ")+'</button><button class="fb-call" onclick="svShare(\''+id+'\')">↗️ مشاركة</button>'+(mine?'<button class="fb-call" onclick="svAudience(\''+id+'\',\''+(e.visibility||"public")+'\')">'+({public:"🌍",friends:"👥",me:"🔒"}[e.visibility||"public"]||"🌍")+' الجمهور</button>':"")+'</div>';
  const i=h.lastIndexOf('<div class="fact"');return i<0?h:h.slice(0,i)+row+h.slice(i);
};
async function svToggle(id){
  try{if(cl.sv.set[id]){await sb("/rest/v1/saved_posts?post_id=eq."+id,{method:"DELETE",prefer:"return=minimal"});delete cl.sv.set[id]}
   else{await sb("/rest/v1/saved_posts",{method:"POST",prefer:"return=minimal",body:{user_id:cs().uid,post_id:id,kind:"svc"}});cl.sv.set[id]="svc";msg("اتحفظ ✅")}refresh()}catch(e){msg(sbErr(e).slice(0,90))}
}
async function svShare(id){
  const url=location.origin+location.pathname+"?post="+id;
  try{if(navigator.share)await navigator.share({title:"يومك",url});else{copyText(url);msg("اتنسخ الرابط ✅")}}catch(e){}
}
function svAudience(id,cur){
  formModal("مين يشوف المنشور؟",'<select id="svVis" class="input"><option value="public"'+(cur==="public"?" selected":"")+'>🌍 الكل</option><option value="friends"'+(cur==="friends"?" selected":"")+'>👥 الأصدقاء فقط</option><option value="me"'+(cur==="me"?" selected":"")+'>🔒 أنا فقط</option></select>',async()=>{
    try{await sb("/rest/v1/service_posts?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{visibility:val("svVis")}});closeModal();msg("تم ✅");refresh()}catch(e){msg(sbErr(e).slice(0,90))}return!1},{save:"حفظ"});
}
PAGES.saved={title:()=>"المحفوظات",render:()=>{
  if(!cs())return authCard();const ids=Object.keys(cl.sv.set);
  if(!cl.sv.items){cl.sv.items=[];ids.length?sb("/rest/v1/service_posts?select=*&id=in.("+ids.join(",")+")").then(async r=>{cl.sv.items=r||[];await loadPeople(cl.sv.items.map(x=>x.user_id));cl.sv.ready=1;renderPage()}):cl.sv.ready=1}
  if(!cl.sv.ready)return '<p class="muted">جاري التحميل…</p>';
  return cl.sv.items.length?cl.sv.items.map(window.svcCard).join(""):'<div class="card empty"><b>لا توجد منشورات محفوظة</b></div>';
},after:()=>{cl.sv.items=null;cl.sv.ready=0}};
PAGES.tag={title:e=>"#"+esc(e&&e.t||""),render:e=>{
  if(!cs())return authCard();const k="tag_"+e.t;
  if(!cl.sv[k]){cl.sv[k]=[];sb("/rest/v1/service_posts?select=*&body=ilike.*"+encodeURIComponent("#"+e.t)+"*&order=created_at.desc&limit=40").then(async r=>{cl.sv[k]=r||[];await loadPeople(cl.sv[k].map(x=>x.user_id));cl.sv[k+"r"]=1;renderPage()});}
  if(!cl.sv[k+"r"])return '<p class="muted">جاري التحميل…</p>';
  return cl.sv[k].length?cl.sv[k].map(window.svcCard).join(""):'<div class="card empty"><b>مفيش منشورات بالهاشتاج ده</b></div>';
},after:e=>{delete cl.sv["tag_"+(e&&e.t)];delete cl.sv["tag_"+(e&&e.t)+"r"]}};
PAGES.search={title:()=>"بحث",render:()=>{
  if(!cs())return authCard();
  return '<input id="srQ" class="input" placeholder="ابحث عن أشخاص، صفحات، جروبات، منشورات، #هاشتاج" value="'+esc(cl.sv.q||"")+'" oninput="srchGo(this.value)"><div id="srRes">'+(cl.sv.res||"")+'</div>';
}};
let srT=null;
function srchGo(q){
  if(curPage()!=="search")openPage("search");
  clearTimeout(srT);cl.sv.q=q;srT=setTimeout(async()=>{
    q=(q||"").trim();const b=el("srRes");if(!b)return;if(q.length<2){b.innerHTML="";cl.sv.res="";return}
    if(q[0]==="#")return openPage("tag",{t:q.slice(1)});
    const E=encodeURIComponent(q);
    try{
      const[p,pg,g,po]=await Promise.all([sb("/rest/v1/profiles?select=id,name,username,avatar,city,country,verified,bio&name=ilike.*"+E+"*&limit=8"),sb("/rest/v1/pages?select=id,name,category,photo&name=ilike.*"+E+"*&limit=6").catch(()=>[]),sb("/rest/v1/groups?select=id,name&name=ilike.*"+E+"*&limit=6").catch(()=>[]),sb("/rest/v1/service_posts?select=*&or=(title.ilike.*"+E+"*,body.ilike.*"+E+"*)&order=created_at.desc&limit=8").catch(()=>[])]);
      (p||[]).forEach(x=>cl.pp[x.id]=cl.pp[x.id]||x);
      let h="";
      if((p||[]).length)h+='<div class="sub2">أشخاص</div>'+p.map(x=>'<div class="person" onclick="openPage(\'user\',{id:\''+x.id+'\'})">'+avHtml(x,36)+'<span class="pb"><b>'+esc(x.name||"")+'</b><small>'+esc(x.city||"")+'</small></span></div>').join("");
      if((pg||[]).length)h+='<div class="sub2">صفحات</div>'+pg.map(x=>'<div class="person" onclick="openPage(\'pagev\',{id:'+x.id+'})"><span class="pb"><b>📄 '+esc(x.name)+'</b><small>'+esc(x.category||"")+'</small></span></div>').join("");
      if((g||[]).length)h+='<div class="sub2">جروبات</div>'+g.map(x=>'<div class="person" onclick="openGroup(\''+x.id+'\',\'posts\')"><span class="pb"><b>👥 '+esc(x.name)+'</b></span></div>').join("");
      if((po||[]).length){await loadPeople(po.map(x=>x.user_id));h+='<div class="sub2">منشورات</div>'+po.map(window.svcCard).join("")}
      cl.sv.res=h||'<p class="muted">مفيش نتائج</p>';const bb=el("srRes");bb&&(bb.innerHTML=cl.sv.res);
    }catch(e){}
  },350);
}
const _gl5=window.gListHtml;
window.gListHtml=function(){return '<div class="card" onclick="openPage(\'search\')" style="cursor:pointer"><b>🔎 بحث شامل</b><p class="muted">ناس، صفحات، جروبات، منشورات وهاشتاج.</p></div><div class="card" onclick="openPage(\'saved\')" style="cursor:pointer"><b>🔖 المحفوظات</b></div>'+_gl5.apply(this,arguments)};
