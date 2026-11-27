/* Phase 4: Admin dashboard (admin only; every query is also enforced by RLS or an is_admin() RPC). */
const dsh={tab:"over",st:null,err:"",kind:"market",items:null,uq:"",users:null,earn:null,bans:{}};
const dshCss=document.createElement("style");
dshCss.textContent=".dshg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}.dshg>div{background:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 1px 4px #0001}.dshg b{display:block;font-size:22px;color:var(--g,#155b50)}.dshg small{color:var(--muted,#667)}.dshb{display:flex;align-items:flex-end;gap:3px;height:90px;background:#fff;border-radius:14px;padding:10px 8px 6px;margin:8px 0}.dshb i{flex:1;background:var(--g,#155b50);border-radius:3px 3px 0 0;min-height:2px;position:relative}.dshb i u{position:absolute;top:-14px;left:0;right:0;text-align:center;font-size:9px;text-decoration:none;color:#667;font-style:normal}.dshr{background:#fff;border-radius:14px;padding:10px 12px;margin:8px 0;box-shadow:0 1px 4px #0001}.dshr .chips{margin-top:6px}";
document.head.append(dshCss);
const dshOk=()=>cs()&&cl.admin;
const dshN=n=>an(Number(n||0));
PAGES.dash={title:()=>"📊 لوحة التحكم",render:()=>{
  if(!dshOk())return '<div class="card empty"><b>غير مصرّح</b><p class="muted">هذه الصفحة للإدارة فقط.</p></div>';
  const t=(k,n)=>'<button class="'+(dsh.tab===k?"on":"")+'" onclick="dshTab(\''+k+'\')">'+n+'</button>';
  return '<div class="seg">'+t("over","نظرة عامة")+t("content","المحتوى")+t("users","المستخدمين")+t("earn","الأرباح")+'</div><div id="dshBody"><p class="muted">جارِ التحميل…</p></div>';
},after:()=>{if(dshOk())dshLoad()}};
(function(){const o=PAGES.admin.render;PAGES.admin.render=function(){const r=o.apply(this,arguments);return dshOk()?'<button class="primary" style="margin-bottom:10px" onclick="openPage(\'dash\')">📊 الإحصائيات والمحتوى والأرباح</button>'+r:r}})();
window.openDash=()=>{dsh.st=null;openPage("dash")};
window.dshTab=k=>{dsh.tab=k;document.querySelectorAll(".seg button").forEach((b,i)=>b.classList.toggle("on",["over","content","users","earn"][i]===k));dshLoad()};
const dshSet=h=>{const b=el("dshBody");if(b)b.innerHTML=h};
async function dshLoad(){
  dshSet('<p class="muted">جارِ التحميل…</p>');
  try{
    if(dsh.tab==="over"){dsh.st=await sb("/rest/v1/rpc/admin_stats",{method:"POST",body:{}});dshOver()}
    else if(dsh.tab==="content")await dshContent();
    else if(dsh.tab==="users")await dshUsers();
    else await dshEarn();
  }catch(e){dshSet('<div class="card">'+esc(sbErr(e))+'</div>')}
}
function dshOver(){
  const s=dsh.st||{},g=(k,l)=>'<div><b>'+dshN(s[k])+'</b><small>'+l+'</small></div>',sg=s.signups||[],mx=Math.max(1,...sg.map(x=>x.n));
  dshSet('<div class="dshg">'+g("users","مستخدم")+g("users_24h","جدد آخر ٢٤ ساعة")+g("users_7d","جدد آخر ٧ أيام")+g("messages_24h","رسالة آخر ٢٤ ساعة")+g("posts","منشور")+g("listings","إعلان في السوق")+g("reels","ريل")+g("reel_views","مشاهدة ريلز")+g("jobs","وظيفة")+g("applications","طلب توظيف")+g("groups","جروب")+g("pages","صفحة")+'</div>'+
   '<div class="dshg"><div><b>'+dshN(s.users_sa)+'</b><small>🇸🇦 السعودية</small></div><div><b>'+dshN(s.users_eg)+'</b><small>🇪🇬 مصر</small></div></div>'+
   '<h4>التسجيلات آخر ١٤ يوم</h4><div class="dshb">'+sg.map(x=>'<i style="height:'+Math.round(x.n/mx*100)+'%"><u>'+(x.n?dshN(x.n):"")+'</u></i>').join("")+'</div>'+
   '<h4>أقسام السوق</h4>'+((s.categories||[]).map(c=>'<div class="dshr" style="display:flex;justify-content:space-between"><span>'+esc(c.c||"-")+'</span><b>'+dshN(c.n)+'</b></div>').join("")||'<p class="muted">لا توجد بيانات</p>')+
   '<div class="dshg"><div onclick="openPage(\'admin\')"><b>'+dshN(s.reports_open)+'</b><small>بلاغات مفتوحة ›</small></div><div onclick="dshTab(\'users\')"><b>'+dshN(s.bans_active)+'</b><small>محظورون حاليًا ›</small></div></div>');
}
const DSH_KINDS={market:["الإعلانات","market_listings","title","market"],reels:["الريلز","reels","caption","reel"],jobs:["الوظائف","job_posts","title","job"],posts:["المنشورات","posts","body","post"],services:["الخدمات","service_posts","body","service"]};
async function dshContent(){
  const k=DSH_KINDS[dsh.kind];
  const r=await sb("/rest/v1/"+k[1]+"?select=*&order=created_at.desc&limit=30")||[];dsh.items=r;
  try{await loadNames(r.map(x=>x.user_id))}catch(e){}
  dshSet('<div class="chips">'+Object.keys(DSH_KINDS).map(x=>'<button class="chip '+(dsh.kind===x?"on":"")+'" onclick="dsh.kind=\''+x+'\';dshLoad()">'+DSH_KINDS[x][0]+'</button>').join("")+'</div>'+
   (r.length?r.map((x,i)=>'<div class="dshr"><b>'+esc(((x[k[2]]||"")+"").slice(0,80)||"—")+'</b><p class="muted" style="margin:2px 0">'+esc(nmOf(x.user_id))+' · '+agoAr(x.created_at)+'</p><div class="chips"><button class="chip" onclick="dshDelItem('+i+')">🗑 حذف</button><button class="chip" onclick="banModal(\''+x.user_id+'\')">⛔ حظر الكاتب</button></div></div>').join(""):'<div class="card empty"><b>لا يوجد محتوى</b></div>'));
}
window.dshDelItem=async i=>{
  const k=DSH_KINDS[dsh.kind],x=(dsh.items||[])[i];if(!x||!confirm("حذف نهائيًا؟"))return;
  try{await delRow("/rest/v1/"+k[1]+"?id=eq."+encodeURIComponent(x.id));await logAdmin("delete_content",x.user_id,k[0]+": "+((x[k[2]]||"")+"").slice(0,120));msg("تم الحذف");dshContent()}catch(e){msg(sbErr(e).slice(0,90))}
};
async function dshUsers(){
  const q=dsh.uq.trim().replace(/[%,()*]/g,"");
  const [u,b]=await Promise.all([sb("/rest/v1/profiles?select=id,name,country,city,created_at,username,avatar&order=created_at.desc&limit=30"+(q?"&name=ilike.*"+encodeURIComponent(q)+"*":"")),sb("/rest/v1/bans?select=user_id,until&limit=200")]);
  dsh.bans={};(b||[]).forEach(x=>{if(!x.until||new Date(x.until)>Date.now())dsh.bans[x.user_id]=1});dsh.users=u||[];
  dshSet('<div class="row"><input id="dshUq" class="input" placeholder="ابحث باسم المستخدم" value="'+esc(dsh.uq)+'" onchange="dsh.uq=this.value;dshUsers()"></div>'+
   (dsh.users.length?dsh.users.map(x=>'<div class="dshr"><div style="display:flex;gap:8px;align-items:center">'+avHtml(x,36)+'<div><b>'+esc(x.name||"")+'</b>'+(dsh.bans[x.id]?' <span class="pill">محظور</span>':"")+'<br><small class="muted">'+esc(x.country||"")+' · '+esc(x.city||"")+' · '+(x.created_at?agoAr(x.created_at):"")+'</small></div></div><div class="chips"><button class="chip" onclick="openPage(\'user\',{id:\''+x.id+'\'})">فتح الملف</button>'+(x.id===cs().uid?"":'<button class="chip" onclick="banModal(\''+x.id+'\')">⛔ حظر</button>')+'</div></div>').join(""):'<div class="card empty"><b>لا نتائج</b></div>'));
}
async function dshEarn(){
  dsh.earn=await sb("/rest/v1/admin_earnings?select=*&order=day.desc,id.desc&limit=200")||[];
  const tot={},mo={},ym=new Date().toISOString().slice(0,7);
  dsh.earn.forEach(x=>{tot[x.currency]=(tot[x.currency]||0)+Number(x.amount);if((x.day||"").slice(0,7)===ym)mo[x.currency]=(mo[x.currency]||0)+Number(x.amount)});
  const f=o=>Object.keys(o).length?Object.keys(o).map(c=>dshN(Math.round(o[c]*100)/100)+" "+c).join(" + "):"٠";
  dshSet('<div class="dshg"><div><b style="font-size:16px">'+f(mo)+'</b><small>هذا الشهر</small></div><div><b style="font-size:16px">'+f(tot)+'</b><small>الإجمالي</small></div></div>'+
   '<p class="muted">سجل يدوي للأرباح. التطبيق لا يحصّل أي مبالغ من المستخدمين حاليًا، وأي مصدر دخل تضيفه هنا يكون من خارج التطبيق.</p><button class="primary" onclick="dshEarnNew()">＋ تسجيل دخل</button>'+
   (dsh.earn.length?dsh.earn.map(x=>'<div class="dshr" style="display:flex;justify-content:space-between;align-items:center"><div><b>'+esc(x.source)+'</b><br><small class="muted">'+esc(x.day)+(x.note?" · "+esc(x.note):"")+'</small></div><div><b>'+dshN(x.amount)+' '+esc(x.currency)+'</b> <button class="chip" onclick="dshEarnDel('+x.id+')">🗑</button></div></div>').join(""):""));
}
window.dshEarnNew=()=>formModal("تسجيل دخل",inp("eSrc","المصدر (مثال: إعلان، اشتراك)","",{max:60})+inp("eAmt","المبلغ","",{type:"number",min:0,mode:"decimal"})+selF("eCur","العملة",[["SAR","ريال سعودي"],["EGP","جنيه مصري"],["USD","دولار"]],"SAR")+inp("eDay","التاريخ",new Date().toISOString().slice(0,10),{type:"date"})+inp("eNote","ملاحظة (اختياري)","",{max:200}),()=>{
  const a=Number(mkNum(val("eAmt")));if(!val("eSrc"))return msg("اكتب المصدر"),!1;if(!(a>=0)||!val("eAmt"))return msg("اكتب مبلغ صحيح"),!1;
  (async()=>{try{await sb("/rest/v1/admin_earnings",{method:"POST",prefer:"return=minimal",body:{source:val("eSrc").slice(0,60),amount:a,currency:val("eCur"),day:val("eDay")||new Date().toISOString().slice(0,10),note:val("eNote").slice(0,200)||null}});msg("تم التسجيل");dshEarn()}catch(e){msg(sbErr(e).slice(0,90))}})();
},{save:"حفظ"});
window.dshEarnDel=async id=>{if(!confirm("حذف السجل؟"))return;try{await sb("/rest/v1/admin_earnings?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});dshEarn()}catch(e){msg(sbErr(e).slice(0,90))}};
/* Reports on reels, jobs and market listings could be closed but not deleted from the reports tab. */
(function(){const o=window.repDelete,M={reel:["reels",/^\d+$/],job:["job_posts",/^\d+$/],market:["market_listings",/^[\w-]{1,64}$/]};
window.repDelete=async function(id){const t=(cl.rlist||[]).find(r=>Number(r.id)===Number(id));if(!t||!M[t.kind])return o.apply(this,arguments);
  if(!confirm("حذف هذا المحتوى نهائيًا؟"))return;const m=M[t.kind];if(!m[1].test(t.target+""))return msg("هدف البلاغ غير صالح");
  try{const a=await delRow("/rest/v1/"+m[0]+"?id=eq."+encodeURIComponent(t.target));await logAdmin("delete_content",t.author,(KIND_AR[t.kind]||t.kind)+": "+((t.snapshot||"")+"").slice(0,120));msg(a?"تم حذف المحتوى":"المحتوى محذوف مسبقًا");await repClose(id,"done")}catch(e){msg(sbErr(e).slice(0,90))}}})();
