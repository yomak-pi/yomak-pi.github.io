/* Phase 3: Jobs. Employers post jobs; people apply inside the app; employers shortlist or reject. */
const jb={list:[],tab:"all",q:"",type:"",city:"",apps:{},mine:{},busy:0,err:""};
KIND_AR.job="وظيفة";
const JB_TYPES=[["full","دوام كامل"],["part","دوام جزئي"],["contract","عقد"],["intern","تدريب"],["remote","عن بُعد"]];
const jbTypeAr=t=>(JB_TYPES.find(x=>x[0]===t)||["",""])[1];
const JB_ST={new:"قيد المراجعة",shortlisted:"تم اختيارك مبدئيًا ✅",rejected:"غير مناسب حاليًا"};
const jbCss=document.createElement("style");
jbCss.textContent=".jbtabs{display:flex;gap:8px;margin:4px 0 10px}.jbtabs button{flex:1;border:0;border-radius:20px;padding:9px 6px;font:inherit;font-weight:700;background:#eef2f1;color:var(--g,#155b50)}.jbtabs button.on{background:var(--g,#155b50);color:#fff}"+
".jbc{background:#fff;border-radius:16px;padding:12px 14px;margin:8px 0;box-shadow:0 1px 4px #0001}.jbc h4{margin:0 0 2px;font-size:16px}.jbc .co{color:var(--muted,#667);font-size:13px}.jbc .tg{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.jbc .tg span{background:#eaf3f1;color:var(--g,#155b50);border-radius:12px;padding:3px 10px;font-size:12px;font-weight:700}.jbc .sal{color:#b36b00;font-weight:800;margin-top:6px}"+
".jbap{background:#f4f7f6;border-radius:12px;padding:10px;margin:8px 0}.jbap .r{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.jbap .r button,.jbap .r a{border:0;border-radius:14px;padding:6px 12px;font:inherit;font-size:13px;background:#fff;color:var(--g,#155b50);text-decoration:none;font-weight:700}.jbclosed{opacity:.6}";
document.head.append(jbCss);
const jbSal=x=>{const f=n=>an(Math.round(n)),c=x.country==="SA"?"ر.س":"ج.م";if(x.salary_min&&x.salary_max)return"💰 "+f(x.salary_min)+" - "+f(x.salary_max)+" "+c;if(x.salary_min||x.salary_max)return"💰 "+f(x.salary_min||x.salary_max)+" "+c;return""};
async function jbLoad(){
  if(jb.busy)return;jb.busy=1;jb.err="";
  try{
    let u="/rest/v1/job_posts?select=*&order=id.desc&limit=200";
    if(jb.tab==="all")u+="&status=eq.open";else if(jb.tab==="mine"&&cs())u+="&user_id=eq."+cs().uid;
    if(jb.tab==="applied"&&cs()){
      const a=await sb("/rest/v1/job_applications?select=job_id,status&user_id=eq."+cs().uid+"&order=id.desc&limit=200")||[];
      jb.mine={};a.forEach(x=>jb.mine[x.job_id]=x.status);
      jb.list=a.length?(await sb("/rest/v1/job_posts?select=*&id=in.("+a.map(x=>x.job_id).join(",")+")&order=id.desc")||[]):[];
    }else{
      jb.list=await sb(u)||[];
      if(cs()){const a=await sb("/rest/v1/job_applications?select=job_id,status&user_id=eq."+cs().uid+"&limit=300").catch(()=>[])||[];jb.mine={};a.forEach(x=>jb.mine[x.job_id]=x.status)}
      if(jb.tab==="mine"&&jb.list.length){
        const r=await sb("/rest/v1/job_applications?select=job_id&job_id=in.("+jb.list.map(x=>x.id).join(",")+")").catch(()=>[])||[];jb.apps={};r.forEach(x=>jb.apps[x.job_id]=(jb.apps[x.job_id]||0)+1);
      }
    }
    try{await loadPeople(jb.list.map(x=>x.user_id))}catch(e){}
  }catch(e){jb.err=sbErr(e);jb.list=[]}
  jb.busy=0;jbDraw();
}
function jbFiltered(){
  const q=jb.q.trim().toLowerCase();
  return jb.list.filter(x=>(!jb.type||x.job_type===jb.type)&&(!jb.city||(x.city||"").includes(jb.city))&&(!q||((x.title||"")+" "+(x.company||"")+" "+(x.field||"")+" "+(x.description||"")).toLowerCase().includes(q)));
}
function jbCard(x){
  const own=cs()&&cs().uid===x.user_id,st=jb.mine[x.id];
  return '<div class="jbc'+(x.status==="closed"?" jbclosed":"")+'" onclick="jbOpen('+x.id+')"><h4>'+esc(x.title)+'</h4><div class="co">'+esc(x.company||((cl.pp[x.user_id]||{}).name)||"")+(x.city?" · 📍 "+esc(x.city):"")+" · "+agoAr(x.created_at)+'</div>'+
  (jbSal(x)?'<div class="sal">'+jbSal(x)+'</div>':"")+'<div class="tg"><span>'+jbTypeAr(x.job_type)+'</span>'+(x.field?'<span>'+esc(x.field)+'</span>':"")+(x.status==="closed"?'<span>مقفولة</span>':"")+(st?'<span>'+esc(JB_ST[st]||"")+'</span>':"")+(own&&jb.apps[x.id]?'<span>👥 '+an(jb.apps[x.id])+' متقدم</span>':"")+'</div></div>';
}
function jbDraw(){
  const b=el("jbList");if(!b)return;
  const l=jbFiltered();
  b.innerHTML=jb.err?'<p class="muted">'+esc(jb.err)+'</p>':l.length?l.map(jbCard).join(""):'<div class="card" style="text-align:center"><div style="font-size:40px">💼</div><b>'+(jb.tab==="mine"?"لسه ما نشرتش وظائف":jb.tab==="applied"?"لسه ما قدمتش على وظائف":"مفيش وظائف دلوقتي")+'</b></div>';
}
PAGES.jobs={title:()=>"💼 وظائف",render:()=>{
  const t=(k,n)=>'<button class="'+(jb.tab===k?"on":"")+'" onclick="jbTab(\''+k+'\')">'+n+'</button>';
  return '<div class="jbtabs">'+t("all","الوظائف")+t("mine","وظائفي")+t("applied","تقديماتي")+'</div>'+
   '<div class="row"><input id="jbQ" class="input" placeholder="ابحث عن وظيفة أو شركة" value="'+esc(jb.q)+'" oninput="jb.q=this.value;jbDraw()"><button class="primary" style="white-space:nowrap" onclick="jbNew()">＋ وظيفة</button></div>'+
   '<div class="row" style="margin:6px 0"><select id="jbT" class="input" onchange="jb.type=this.value;jbDraw()"><option value="">كل الأنواع</option>'+JB_TYPES.map(x=>'<option value="'+x[0]+'"'+(jb.type===x[0]?" selected":"")+'>'+x[1]+'</option>').join("")+'</select><input id="jbC" class="input" placeholder="المدينة" value="'+esc(jb.city)+'" oninput="jb.city=this.value;jbDraw()"></div><div id="jbList"><p class="muted">جارِ التحميل…</p></div>';
},after:()=>{jb.busy=0;jbLoad()}};
window.openJobs=()=>{jb.tab="all";jb.q="";jb.type="";jb.city="";openPage("jobs")};
window.jbTab=k=>{if(k!=="all"&&!cs())return authModal("signup");jb.tab=k;jb.list=[];const n=document.querySelectorAll(".jbtabs button");n.forEach((b,i)=>b.classList.toggle("on",["all","mine","applied"][i]===k));const l=el("jbList");if(l)l.innerHTML='<p class="muted">جارِ التحميل…</p>';jb.busy=0;jbLoad()};
window.jbOpen=async id=>{
  const x=jb.list.find(j=>j.id===id);if(!x)return;
  const own=cs()&&cs().uid===x.user_id,p=cl.pp[x.user_id]||{id:x.user_id,name:"مستخدم"},st=jb.mine[id];
  let act="";
  if(own||(cs()&&cl.admin))act='<div class="row" style="margin-top:10px"><button class="secondary" onclick="jbToggle('+id+')">'+(x.status==="open"?"قفل التقديم":"إعادة فتح")+'</button><button class="secondary" style="color:#b0352d" onclick="jbDel('+id+')">🗑 حذف</button></div><div id="jbApps"><p class="muted">جارِ تحميل المتقدمين…</p></div>';
  else if(st)act='<p class="card">طلبك: <b>'+esc(JB_ST[st]||"")+'</b></p>';
  else if(x.status==="open")act='<button class="primary" style="margin-top:12px" onclick="jbApply('+id+')">قدّم الآن</button>';
  else act='<p class="muted">التقديم مقفول</p>';
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>'+esc(x.title)+'</h3><div class="co" style="color:var(--muted,#667)">'+esc(x.company||"")+(x.city?" · 📍 "+esc(x.city):"")+'</div>'+(jbSal(x)?'<div class="sal" style="color:#b36b00;font-weight:800;margin:6px 0">'+jbSal(x)+'</div>':"")+
   '<div class="jbc" style="box-shadow:none;background:#f4f7f6"><div class="tg"><span>'+jbTypeAr(x.job_type)+'</span>'+(x.field?'<span>'+esc(x.field)+'</span>':"")+'</div></div><h4>الوصف</h4><p style="white-space:pre-wrap">'+esc(x.description)+'</p>'+(x.requirements?'<h4>المتطلبات</h4><p style="white-space:pre-wrap">'+esc(x.requirements)+'</p>':"")+
   '<div class="row" style="align-items:center;gap:8px" onclick="closeModal();openPage(\'user\',{id:\''+x.user_id+'\'})">'+avHtml(p,32)+'<span>'+esc(p.name||"")+'</span></div>'+act+(own?"":'<button class="secondary" style="margin-top:8px" onclick="reportItem(\'job\','+id+')">🚩 إبلاغ</button>'));
  if(own||cs()&&cl.admin)jbApps(id);
};
async function jbApps(id){
  try{
    const a=await sb("/rest/v1/job_applications?select=*&job_id=eq."+id+"&order=id.desc&limit=100")||[];
    try{await loadPeople(a.map(x=>x.user_id))}catch(e){}
    const b=el("jbApps");if(!b)return;jb.apps[id]=a.length;
    b.innerHTML='<h4>👥 المتقدمين ('+an(a.length)+')</h4>'+(a.length?a.map(x=>{const p=cl.pp[x.user_id]||{id:x.user_id,name:"مستخدم"},ph=(x.phone||"").replace(/[^\d+]/g,"");
      return '<div class="jbap"><div style="display:flex;gap:8px;align-items:center" onclick="closeModal();openPage(\'user\',{id:\''+x.user_id+'\'})">'+avHtml(p,32)+'<b>'+esc(p.name||"")+'</b><small>'+agoAr(x.created_at)+'</small></div>'+(x.experience?'<p style="margin:6px 0 0">'+esc(x.experience)+'</p>':"")+(x.message?'<p style="margin:6px 0 0;color:var(--muted,#667)">'+esc(x.message)+'</p>':"")+
      '<div class="r"><span>'+esc(JB_ST[x.status]||"").replace("تم اختيارك مبدئيًا","مختار")+'</span>'+(ph?'<a href="tel:'+ph+'">📞 اتصال</a>':"")+(x.cv_path?'<button onclick="jbCv(\''+x.cv_path+'\')">📄 السيرة الذاتية</button>':"")+'<button onclick="jbSet('+x.id+',\'shortlisted\','+id+')">✅ اختيار</button><button onclick="jbSet('+x.id+',\'rejected\','+id+')">✖ رفض</button></div></div>'}).join(""):'<p class="muted">لسه مفيش متقدمين</p>');
  }catch(e){const b=el("jbApps");if(b)b.innerHTML='<p class="muted">'+esc(sbErr(e))+'</p>'}
}
window.jbSet=async(aid,s,jid)=>{try{await sb("/rest/v1/job_applications?id=eq."+aid,{method:"PATCH",prefer:"return=minimal",body:{status:s}});jbApps(jid)}catch(e){msg(sbErr(e).slice(0,80))}};
window.jbToggle=async id=>{const x=jb.list.find(j=>j.id===id),s=x.status==="open"?"closed":"open";try{await sb("/rest/v1/job_posts?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{status:s}});x.status=s;closeModal();msg(s==="open"?"اتفتح التقديم":"اتقفل التقديم");jbDraw()}catch(e){msg(sbErr(e).slice(0,80))}};
window.jbDel=async id=>{if(!confirm("حذف الوظيفة وكل التقديمات عليها؟"))return;try{await sb("/rest/v1/job_posts?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});jb.list=jb.list.filter(j=>j.id!==id);closeModal();msg("تم الحذف");jbDraw()}catch(e){msg(sbErr(e).slice(0,80))}};
window.jbApply=id=>{
  if(!cs())return authModal("signup");if(banStop())return;
  formModal("قدّم على الوظيفة",inp("jbPh","رقم موبايل للتواصل","",{type:"tel",max:24,mode:"tel"})+inp("jbEx","خبرتك باختصار","",{area:1,max:1000,rows:3})+inp("jbMs","رسالة لصاحب الوظيفة (اختياري)","",{area:1,max:1000,rows:2})+'<label class="lbl" for="jbCv">السيرة الذاتية (اختياري، PDF أو Word، حتى 2 ميجا)</label><input id="jbCv" class="input" type="file" accept=".pdf,.doc,.docx,application/pdf">',()=>{
    if(!window.YOMAK_PI&&!val("jbPh"))return msg("اكتب رقم موبايل"),!1;
    (async()=>{try{await ensureProfile();const cvf=el("jbCv")&&el("jbCv").files[0];let cvp=null;if(cvf){if(cvf.size>2097152)return msg("الملف أكبر من 2 ميجا");const ex=(cvf.name.split(".").pop()||"pdf").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,5);cvp=cs().uid+"/"+Date.now().toString(36)+"."+ex;const u=await fetch(SB_URL+"/storage/v1/object/cvs/"+cvp,{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+cs().access,"Content-Type":cvf.type||"application/pdf"},body:cvf});if(!u.ok)return msg("رفع السيرة الذاتية فشل")}await sb("/rest/v1/job_applications",{method:"POST",prefer:"return=minimal",body:{cv_path:cvp,job_id:id,phone:val("jbPh").slice(0,24)||null,experience:val("jbEx").slice(0,1000)||null,message:val("jbMs").slice(0,1000)||null}});jb.mine[id]="new";msg("تم إرسال طلبك ✅");jbDraw()}catch(e){msg(/duplicate|23505/.test(String(e.message||e))?"قدمت قبل كده":sbErr(e).slice(0,80))}})();
  },{save:"إرسال الطلب"});
};
window.jbNew=()=>{
  if(!cs())return authModal("signup");if(banStop())return;
  formModal("💼 وظيفة جديدة",inp("jbTi","المسمى الوظيفي","",{max:100})+inp("jbCo","اسم الشركة / الجهة","",{max:80})+inp("jbCi","المدينة",d.city||"",{max:60})+selF("jbTy","النوع",JB_TYPES,"full")+inp("jbFi","المجال (مثال: مبيعات، محاسبة)","",{max:30})+
   '<div class="row"><div style="flex:1">'+inp("jbS1","الراتب من","",{type:"number",min:0,mode:"numeric"})+'</div><div style="flex:1">'+inp("jbS2","إلى","",{type:"number",min:0,mode:"numeric"})+'</div></div>'+
   inp("jbDe","وصف الوظيفة","",{area:1,max:3000,rows:4})+inp("jbRq","المتطلبات (اختياري)","",{area:1,max:2000,rows:3})+inp("jbCp","رقم تواصل (اختياري)","",{type:"tel",max:24,mode:"tel"}),()=>{
    const t=val("jbTi"),de=val("jbDe");if(t.length<3)return msg("اكتب المسمى الوظيفي"),!1;if(de.length<10)return msg("اكتب وصف أطول للوظيفة"),!1;
    const n=v=>{v=mkNum(val(v));return v?Number(v):null},s1=n("jbS1"),s2=n("jbS2");if(s1!=null&&s2!=null&&s2<s1)return msg("الراتب (إلى) أقل من (من)"),!1;
    (async()=>{try{await ensureProfile();await sb("/rest/v1/job_posts",{method:"POST",prefer:"return=minimal",body:{title:t.slice(0,100),company:val("jbCo").slice(0,80)||null,city:val("jbCi").slice(0,60)||null,country:d.country==="SA"?"SA":"EG",job_type:val("jbTy"),field:val("jbFi").slice(0,30)||null,salary_min:s1,salary_max:s2,description:de.slice(0,3000),requirements:val("jbRq").slice(0,2000)||null,contact_phone:val("jbCp").slice(0,24)||null}});msg("تم نشر الوظيفة 💼");jb.tab="mine";if(curPage()==="jobs")jbTab("mine")}catch(e){msg(sbErr(e).slice(0,80))}})();
  },{save:"نشر"});
};
(function(){const f=window.findItem;window.findItem=function(k,id){if(k==="job"){const x=jb.list.find(r=>String(r.id)===String(id));if(x)return{author:x.user_id,snap:x.title,ref:String(x.id)}}return f.apply(this,arguments)}})();
/* Tapping a job notification opens that job. */
(function(){const o=window.nOpen;window.nOpen=async function(id){
  const n=(cl.nlist||[]).find(x=>x.id===id);
  if(!n||(n.kind!=="job_app"&&n.kind!=="job_status"))return o.apply(this,arguments);
  if(!n.read){n.read=true;try{nSetBadge(Math.max(0,cl.nunread-1));await sb("/rest/v1/notifications?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{read:true}})}catch(e){}}
  const jid=Number(n.ref_id);if(!jid)return openJobs();
  jb.tab=n.kind==="job_app"?"mine":"applied";jb.q="";jb.type="";jb.city="";jb.list=[];openPage("jobs");
  const t=setInterval(()=>{if(!jb.busy&&jb.list.some(x=>x.id===jid)){clearInterval(t);jbOpen(jid)}},300);setTimeout(()=>clearInterval(t),6000);
}})();

window.jbCv=async p=>{try{const r=await fetch(SB_URL+"/storage/v1/object/sign/cvs/"+p,{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+cs().access,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:300})});const j=await r.json();if(!j.signedURL)throw 0;window.open(SB_URL+"/storage/v1"+j.signedURL,"_blank")}catch(e){msg("مقدرتش أفتح الملف")}};
