/* v81: expenses page rebuilt. Quick add (one tap), income and expense, categories with budgets, month summary and charts, 6-month comparison, recurring items, search and filters, CSV and PDF export. Expenses stay in d.expenses (same as before); income, category budgets and recurring items live in localStorage "yk_fin" on this device. */
(function(){
const FC=["أكل","مواصلات","تسوق","فواتير","صحة","ترفيه","تعليم","منزل","أخرى"];
try{FC.forEach(c=>{if(typeof CATS!=="undefined"&&!CATS.includes(c))CATS.push(c)})}catch(e){}
const IC={"أكل":"🍔","مواصلات":"🚗","تسوق":"🛒","فواتير":"🧾","صحة":"💊","ترفيه":"🎮","تعليم":"📚","منزل":"🏠","أخرى":"💸"};
const CL={"أكل":"#f4a93b","مواصلات":"#4e8cf0","تسوق":"#e8556d","فواتير":"#8e6cf0","صحة":"#12a88a","ترفيه":"#f06fb0","تعليم":"#2ab7ca","منزل":"#9a7b4f","أخرى":"#8a9a95"};
const ic=c=>IC[c]||"💸",cc=c=>CL[c]||"#8a9a95";
const MN=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
let fin=(()=>{try{const x=JSON.parse(localStorage.getItem("yk_fin")||"{}");return {inc:Array.isArray(x.inc)?x.inc:[],cb:x.cb&&typeof x.cb==="object"?x.cb:{},rec:Array.isArray(x.rec)?x.rec:[],del:Array.isArray(x.del)?x.del.slice(-500):[],eu:x.eu&&typeof x.eu==="object"?x.eu:{},ts:Number(x.ts)||0}}catch(e){return {inc:[],cb:{},rec:[],del:[],eu:{},ts:0}}})();
function sv(){try{localStorage.setItem("yk_fin",JSON.stringify(fin));return true}catch(e){msg("تعذر الحفظ على الجهاز");return false}}
const touch=()=>{fin.ts=Date.now();const ok=sv();try{window.ykFinChanged&&window.ykFinChanged()}catch(e){}return ok};
window.ykFin={get:()=>fin,set:f=>{fin=f},save:sv,touch};
const S={m:todayKey().slice(0,7),q:"",type:"all",cat:"all",type_in:false,sel:"",amt:""};
const num=x=>{x=Number(String(x).replace(/[٠-٩]/g,c=>c.charCodeAt(0)-1632).replace(/[,،]/g,"."));return x};
const ex=()=>d.expenses.filter(e=>e.currency===cur()),inc=()=>fin.inc.filter(e=>e.currency===cur());
const inM=(a,m)=>a.filter(e=>String(e.date).startsWith(m));
const sum=a=>a.reduce((n,e)=>n+Number(e.amount),0);
const uid=()=>Date.now()+Math.floor(Math.random()*1000);
function shiftM(m,k){let [y,mo]=m.split("-").map(Number);mo+=k;while(mo>12){mo-=12;y++}while(mo<1){mo+=12;y--}return y+"-"+String(mo).padStart(2,"0")}
const mName=m=>MN[Number(m.slice(5))-1]+" "+m.slice(0,4);
/* recurring: add this month's entry once its day has come (runs when the page opens) */
function applyRec(){const t=todayKey(),m=t.slice(0,7),day=Number(t.slice(8));let ch=0;
  fin.rec.forEach(r=>{if(r.currency!==cur()||r.last===m||Number(r.day)>day)return;
    const date=m+"-"+String(Math.min(Number(r.day),28)).padStart(2,"0");
    if(r.type==="in"){fin.inc.push({id:uid(),amount:r.amount,title:r.title,date,currency:r.currency,rec:r.id})}
    else tx(()=>{d.expenses.push({id:newId(),amount:r.amount,title:r.title,cat:r.cat,date,currency:r.currency})});
    r.last=m;ch=1});
  if(ch)touch()}
function donut(rows,total){if(!total)return "";let off=0;const R=52,C=2*Math.PI*R;
  return '<svg viewBox="0 0 140 140" width="132" height="132" aria-hidden="true"><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="#eef3f1" stroke-width="22"/>'+rows.map(r=>{const l=r[1]/total*C,s='<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="'+cc(r[0])+'" stroke-width="22" stroke-dasharray="'+l+" "+(C-l)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 70 70)"/>';off+=l;return s}).join("")+'<text x="70" y="66" text-anchor="middle" font-size="11" fill="#5b6b66">المصروف</text><text x="70" y="84" text-anchor="middle" font-size="14" font-weight="800" fill="#10302d">'+Math.round(total).toLocaleString("ar-EG")+'</text></svg>'}
function dailyBars(m,list){const [y,mo]=m.split("-").map(Number),n=new Date(y,mo,0).getDate(),a=Array(n).fill(0);list.forEach(e=>{const k=Number(String(e.date).slice(8,10));if(k>=1&&k<=n)a[k-1]+=Number(e.amount)});const mx=Math.max(...a,1);
  return '<div class="fn-bars">'+a.map((v,i)=>'<i title="'+(i+1)+': '+Math.round(v)+'" style="height:'+Math.max(3,v/mx*100)+'%;'+(v?'':'opacity:.25')+'"></i>').join("")+'</div><div class="fn-ax"><span>١</span><span>'+Math.round(n/2).toLocaleString("ar-EG")+'</span><span>'+n.toLocaleString("ar-EG")+'</span></div>'}
function sixM(){const rows=[];for(let k=-5;k<=0;k++){const m=shiftM(todayKey().slice(0,7),k);rows.push([m,sum(inM(inc(),m)),sum(inM(ex(),m))])}const mx=Math.max(...rows.flatMap(r=>[r[1],r[2]]),1);
  return '<div class="fn-six">'+rows.map(r=>'<div><div class="b"><i class="in" style="height:'+Math.max(2,r[1]/mx*100)+'%"></i><i class="out" style="height:'+Math.max(2,r[2]/mx*100)+'%"></i></div><small>'+MN[Number(r[0].slice(5))-1].slice(0,4)+'</small></div>').join("")+'</div><div class="fn-lg"><span><i class="in"></i>دخل</span><span><i class="out"></i>مصروف</span></div>'}
function txs(){let a=inM(ex(),S.m).map(e=>({...e,k:"out"})).concat(inM(inc(),S.m).map(e=>({...e,k:"in",cat:"دخل"})));
  if(S.type!=="all")a=a.filter(e=>e.k===S.type);if(S.cat!=="all")a=a.filter(e=>e.cat===S.cat);
  if(S.q){const q=norm(S.q);a=a.filter(e=>norm(e.title+" "+e.cat).includes(q))}
  return a.sort((x,y)=>x.date<y.date?1:x.date>y.date?-1:y.id-x.id)}
function txList(){const a=txs();if(!a.length)return '<div class="empty">مفيش حركات مطابقة</div>';let last="",h="";
  a.slice(0,200).forEach(e=>{if(e.date!==last){last=e.date;h+='<div class="fn-day">'+(e.date===todayKey()?"النهاردة":e.date)+'</div>'}
   h+='<div class="fn-tx" role="button" tabindex="0" onclick="fnEdit(\''+e.k+'\','+e.id+')"><span class="ei" style="background:'+(e.k==="in"?"#e0f4e8":cc(e.cat)+"22")+'">'+(e.k==="in"?"💵":ic(e.cat))+'</span><div><b>'+esc(e.title)+'</b><small>'+esc(e.cat)+'</small></div><b class="'+(e.k==="in"?"pos":"neg")+'">'+(e.k==="in"?"+":"−")+cash(e.amount)+'</b></div>'});
  return h}
function chips(sel,fn){return FC.map(c=>'<button type="button" class="fn-c'+(sel===c?" on":"")+'" onclick="'+fn+'(\''+c+'\')">'+ic(c)+" "+c+'</button>').join("")}
window.expenses=function(){
  applyRec();
  const m=S.m,E=inM(ex(),m),I=inM(inc(),m),te=sum(E),ti=sum(I),bal=ti-te,b=budgetVal();
  const by={};E.forEach(e=>by[e.cat]=(by[e.cat]||0)+Number(e.amount));const rows=Object.entries(by).sort((x,y)=>y[1]-x[1]);
  const catRows=rows.map(r=>{const cb=Number(fin.cb[r[0]]||0),p=cb?Math.min(100,r[1]/cb*100):r[1]/te*100;return '<div class="fn-cat" role="button" tabindex="0" onclick="fnCatBudget(\''+r[0]+'\')"><div class="row between"><span>'+ic(r[0])+' <b>'+r[0]+'</b></span><span>'+cash(r[1])+(cb?' <small class="muted">من '+cash(cb)+'</small>':'')+'</span></div><div class="progress" style="background:#e7efeb;height:8px"><span style="width:'+p+'%;background:'+(cb&&r[1]>cb?"#d9534f":cc(r[0]))+'"></span></div>'+(cb&&r[1]>cb?'<small class="warn">⚠ تجاوزت بـ '+cash(r[1]-cb)+'</small>':'')+'</div>'}).join("");
  const unb=FC.filter(c=>!by[c]&&fin.cb[c]).map(c=>'<div class="fn-cat" role="button" tabindex="0" onclick="fnCatBudget(\''+c+'\')"><div class="row between"><span>'+ic(c)+' <b>'+c+'</b></span><small class="muted">ميزانية '+cash(fin.cb[c])+'</small></div></div>').join("");
  const rec=fin.rec.filter(r=>r.currency===cur()).map(r=>'<div class="fn-tx" role="button" tabindex="0" onclick="fnRecEdit('+r.id+')"><span class="ei" style="background:'+(r.type==="in"?"#e0f4e8":cc(r.cat)+"22")+'">'+(r.type==="in"?"💵":ic(r.cat))+'</span><div><b>'+esc(r.title)+'</b><small>كل شهر يوم '+Number(r.day).toLocaleString("ar-EG")+'</small></div><b class="'+(r.type==="in"?"pos":"neg")+'">'+cash(r.amount)+'</b></div>').join("");
  return '<div class="fn">'+
  '<div class="fn-mon"><button onclick="fnM(-1)" aria-label="الشهر السابق">›</button><b>'+mName(m)+'</b><button onclick="fnM(1)" aria-label="الشهر التالي">‹</button></div>'+
  '<div class="fn-hero"><small>الرصيد هذا الشهر</small><div class="big">'+(bal<0?"−":"")+cash(Math.abs(bal))+'</div><div class="fn-io"><div><small>⬇ الدخل</small><b>'+cash(ti)+'</b></div><div><small>⬆ المصروف</small><b>'+cash(te)+'</b></div></div>'+
   (b?'<div class="progress" style="background:#ffffff33;margin-top:12px"><span style="width:'+Math.min(100,te/b*100)+'%;background:'+(te>b?"#ff8f8f":"#f4c15d")+'"></span></div><small>'+(te>b?"⚠ تجاوزت ميزانية الشهر بـ "+cash(te-b):"المتبقي من الميزانية "+cash(b-te))+'</small>':'<small>حدد ميزانية الشهر من زرار الميزانية تحت</small>')+'</div>'+
  '<div class="card fn-add"><div class="fn-seg"><button class="'+(!S.type_in?"on":"")+'" onclick="fnIn(false)">مصروف</button><button class="'+(S.type_in?"on":"")+'" onclick="fnIn(true)">دخل</button></div>'+
   '<input id="fnAmt" class="input fn-amt" type="text" inputmode="decimal" placeholder="المبلغ" aria-label="المبلغ" value="'+esc(S.amt)+'" oninput="S_amt(this.value)">'+
   '<input id="fnTitle" class="input" maxlength="60" placeholder="وصف (اختياري)" aria-label="وصف">'+
   (S.type_in?'<button class="primary" onclick="fnQuick(\'دخل\')">＋ سجّل دخل</button>':'<div class="fn-chips">'+chips(S.sel,"fnQuick")+'</div><small class="muted">اكتب المبلغ واضغط على الفئة وهتتسجل فورًا</small>')+'</div>'+
  (te?'<div class="card"><b>المصروف حسب الفئة</b><div class="fn-donut">'+donut(rows,te)+'<div class="fn-leg">'+rows.slice(0,5).map(r=>'<span><i style="background:'+cc(r[0])+'"></i>'+r[0]+' '+Math.round(r[1]/te*100).toLocaleString("ar-EG")+'٪</span>').join("")+'</div></div>'+catRows+(unb||"")+'<small class="muted">اضغط على أي فئة لتحديد ميزانيتها</small></div>':'<div class="card"><b>المصروف حسب الفئة</b><p class="muted">لسه مفيش مصروفات في الشهر ده.</p>'+(unb||"")+'</div>')+
  (te?'<div class="card"><b>المصروف يوم بيوم</b>'+dailyBars(m,E)+'</div>':'')+
  '<div class="card"><b>الدخل والمصروف آخر ٦ شهور</b>'+sixM()+'</div>'+
  '<div class="card"><div class="row between"><b>🔁 المتكرر كل شهر</b><button class="secondary" style="width:auto;padding:6px 12px" onclick="fnRecEdit(0)">＋ إضافة</button></div>'+(rec||'<p class="muted">إيجار، اشتراكات، راتب... سجّلها مرة وتتسجل لوحدها كل شهر لما تفتح التطبيق.</p>')+'</div>'+
  '<div class="card"><div class="row between"><b>الحركات</b><span class="muted">'+txs().length.toLocaleString("ar-EG")+'</span></div>'+
   '<input class="input" type="search" placeholder="🔎 ابحث بالاسم أو الفئة" value="'+esc(S.q)+'" oninput="fnQ(this.value)" aria-label="بحث">'+
   '<div class="fn-chips"><button class="fn-c'+(S.type==="all"?" on":"")+'" onclick="fnT(\'all\')">الكل</button><button class="fn-c'+(S.type==="out"?" on":"")+'" onclick="fnT(\'out\')">مصروف</button><button class="fn-c'+(S.type==="in"?" on":"")+'" onclick="fnT(\'in\')">دخل</button></div>'+
   '<div class="fn-chips"><button class="fn-c'+(S.cat==="all"?" on":"")+'" onclick="fnC(\'all\')">كل الفئات</button>'+chips(S.cat,"fnC")+'</div><div id="fnList">'+txList()+'</div></div>'+
  '<div class="fn-foot"><button class="secondary" onclick="budgetModal()">🎯 ميزانية الشهر</button><button class="secondary" onclick="fnCsv()">⬇ ملف Excel (CSV)</button><button class="secondary" onclick="expPdf()">📄 تقرير PDF</button></div>'+
  '<p class="muted" style="font-size:12px;text-align:center">بيانات الدخل والميزانيات والمتكرر محفوظة على جهازك.</p></div>'};
const R=()=>{try{render()}catch(e){}};
const _rd=window.render;window.render=function(){const r=_rd.apply(this,arguments);if(current==="expenses")document.body.classList.add("comm");return r};
window.S_amt=v=>{S.amt=v};
window.fnM=k=>{S.m=shiftM(S.m,k);R()};
window.fnIn=v=>{S.type_in=v;R()};
window.fnQ=v=>{S.q=v;const l=document.getElementById("fnList");if(l)l.innerHTML=txList()};
window.fnT=v=>{S.type=v;R()};window.fnC=v=>{S.cat=v;R()};
window.fnQuick=cat=>{const a=num(S.amt||(document.getElementById("fnAmt")||{}).value);if(!Number.isFinite(a)||a<=0)return msg("اكتب المبلغ الأول");if(a>1e9)return msg("المبلغ كبير جدًا");
  const t=((document.getElementById("fnTitle")||{}).value||"").trim().slice(0,60),date=todayKey();
  if(S.type_in){fin.inc.push({id:uid(),amount:a,title:t||"دخل",date,currency:cur()})}
  else if(!tx(()=>{d.expenses.push({id:newId(),amount:a,title:t||cat,cat,date,currency:cur()})}))return;
  touch();S.amt="";S.m=date.slice(0,7);R();msg(S.type_in?"تم تسجيل الدخل ✅":"تم تسجيل المصروف ✅")};
/* edit / delete */
window.fnEdit=(k,id)=>{const e=(k==="in"?fin.inc:d.expenses).find(x=>x.id===id);if(!e)return;
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>'+(k==="in"?"تعديل الدخل":"تعديل المصروف")+'</h3><input id="feT" class="input" maxlength="60" value="'+esc(e.title)+'" aria-label="الوصف"><input id="feA" class="input" type="text" inputmode="decimal" value="'+e.amount+'" aria-label="المبلغ"><input id="feD" class="input" type="date" value="'+esc(e.date)+'" aria-label="التاريخ">'+(k==="out"?'<select id="feC" class="input">'+FC.concat(FC.includes(e.cat)?[]:[e.cat]).map(c=>'<option'+(c===e.cat?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select>':'')+'<button class="primary" onclick="fnSave(\''+k+'\','+id+')">حفظ</button><button class="secondary" style="margin-top:8px;color:#c0392b" onclick="fnDel(\''+k+'\','+id+')">🗑️ حذف</button>')};
window.fnSave=(k,id)=>{const a=num(el("feA").value),t=el("feT").value.trim().slice(0,60),dt=el("feD").value;if(!Number.isFinite(a)||a<=0||a>1e9)return msg("اكتب مبلغ صحيح");if(!/^\d{4}-\d{2}-\d{2}$/.test(dt))return msg("اختار التاريخ");
  if(k==="in"){const e=fin.inc.find(x=>x.id===id);if(!e)return;e.amount=a;e.title=t||"دخل";e.date=dt}
  else{const c=el("feC").value;if(!tx(()=>{const e=d.expenses.find(x=>x.id===id);if(!e)throw 0;e.amount=a;e.title=t||c;e.date=dt;e.cat=c}))return}
  fin.eu[id]=Date.now();touch();closeModal();R();msg("تم الحفظ")};
window.fnDel=(k,id)=>{if(!confirm("حذف الحركة دي؟"))return;if(k==="in"){fin.inc=fin.inc.filter(x=>x.id!==id)}else tx(()=>{d.expenses=d.expenses.filter(x=>x.id!==id)});fin.del.push(k+id);touch();closeModal();R();msg("تم الحذف")};
/* category budget */
window.fnCatBudget=c=>{openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>ميزانية '+ic(c)+" "+esc(c)+'</h3><input id="fcb" class="input" type="text" inputmode="decimal" placeholder="المبلغ الشهري" value="'+(fin.cb[c]||"")+'"><button class="primary" onclick="fnCbSave(\''+c+'\')">حفظ</button>'+(fin.cb[c]?'<button class="secondary" style="margin-top:8px" onclick="fnCbSave(\''+c+'\',1)">إلغاء الميزانية</button>':''))};
window.fnCbSave=(c,del)=>{const a=num(el("fcb").value||0);if(del||!a)delete fin.cb[c];else if(!Number.isFinite(a)||a<0||a>1e9)return msg("اكتب مبلغ صحيح");else fin.cb[c]=a;if(!touch())return;closeModal();R()};
/* recurring */
window.fnRecEdit=id=>{const r=fin.rec.find(x=>x.id===id)||{type:"out",cat:"فواتير",day:1,title:"",amount:""};
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>'+(id?"تعديل المتكرر":"متكرر جديد")+'</h3><div class="fn-seg"><button id="frO" class="'+(r.type!=="in"?"on":"")+'" onclick="this.className=\'on\';frI.className=\'\'">مصروف</button><button id="frI" class="'+(r.type==="in"?"on":"")+'" onclick="this.className=\'on\';frO.className=\'\'">دخل</button></div><input id="frT" class="input" maxlength="60" placeholder="الاسم (إيجار، اشتراك، راتب…)" value="'+esc(r.title)+'"><input id="frA" class="input" type="text" inputmode="decimal" placeholder="المبلغ" value="'+r.amount+'"><select id="frC" class="input">'+FC.map(c=>'<option'+(c===r.cat?" selected":"")+'>'+c+'</option>').join("")+'</select><input id="frD" class="input" type="number" min="1" max="28" placeholder="يوم الشهر (١-٢٨)" value="'+r.day+'"><button class="primary" onclick="fnRecSave('+id+')">حفظ</button>'+(id?'<button class="secondary" style="margin-top:8px;color:#c0392b" onclick="fnRecDel('+id+')">🗑️ حذف</button>':''))};
window.fnRecSave=id=>{const a=num(el("frA").value),day=Math.round(Number(el("frD").value)),t=el("frT").value.trim().slice(0,60);if(!t)return msg("اكتب الاسم");if(!Number.isFinite(a)||a<=0||a>1e9)return msg("اكتب مبلغ صحيح");if(!(day>=1&&day<=28))return msg("اليوم من ١ لـ ٢٨");
  const o={title:t,amount:a,cat:el("frC").value,day,type:el("frI").className==="on"?"in":"out",currency:cur()};
  if(id){const r=fin.rec.find(x=>x.id===id);if(r)Object.assign(r,o)}else fin.rec.push({id:uid(),...o,last:""});if(!touch())return;closeModal();R()};
window.fnRecDel=id=>{if(!confirm("حذف المتكرر ده؟ اللي اتسجل قبل كده هيفضل."))return;fin.rec=fin.rec.filter(x=>x.id!==id);fin.del.push("rec"+id);touch();closeModal();R()};
/* export */
window.fnCsv=()=>{const rows=[["التاريخ","النوع","الفئة","الوصف","المبلغ","العملة"]];
  ex().concat([]).forEach(e=>rows.push([e.date,"مصروف",e.cat,e.title,e.amount,e.currency]));inc().forEach(e=>rows.push([e.date,"دخل","",e.title,e.amount,e.currency]));
  rows.sort((a,b)=>a===rows[0]?-1:b===rows[0]?1:a[0]<b[0]?1:-1);
  const cell=v=>{let s=String(v==null?"":v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const blob=new Blob(["\ufeff"+rows.map(r=>r.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="yomak-expenses-"+todayKey()+".csv";document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);msg("تم تجهيز الملف")};
const st=document.createElement("style");st.textContent=`
.fn{display:grid;gap:12px}.fn .card{margin:0}
.fn-mon{display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:18px;box-shadow:var(--sh1);padding:4px}.fn-mon b{font-size:17px}.fn-mon button{width:44px;height:44px;border:0;border-radius:14px;background:#eef4f1;font-size:22px;color:var(--g)}
.fn-hero{background:var(--ykg);color:#fff;border-radius:24px;padding:18px;box-shadow:0 12px 30px #0b4f4638}.fn-hero .big{font-size:34px;font-weight:800;margin:2px 0 12px}.fn-hero small{opacity:.85}
.fn-io{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fn-io div{background:#ffffff1f;border-radius:16px;padding:10px 12px}.fn-io b{display:block;font-size:17px;margin-top:2px}
.fn-add{display:grid;gap:10px}.fn-seg{display:grid;grid-template-columns:1fr 1fr;background:#eef4f1;border-radius:14px;padding:3px}.fn-seg button{border:0;background:none;border-radius:11px;min-height:40px;font-weight:700;color:var(--muted)}.fn-seg button.on{background:#fff;color:var(--g);box-shadow:var(--sh1)}
.fn-amt{font-size:26px!important;font-weight:800;text-align:center;min-height:56px}
.fn-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.fn-c{border:0;background:#eef4f1;border-radius:20px;min-height:38px;padding:0 12px;font:inherit;font-size:13px;font-weight:700;color:var(--dark)}.fn-c.on{background:var(--ykg);color:#fff}
.fn-donut{display:flex;align-items:center;gap:12px;margin:10px 0}.fn-leg{display:grid;gap:5px;font-size:13px}.fn-leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-left:6px}
.fn-cat{padding:8px 0;border-top:1px solid var(--line)}.fn-cat .progress{margin-top:6px}
.fn-bars{display:flex;align-items:flex-end;gap:2px;height:84px;direction:ltr}.fn-bars i{flex:1;background:var(--g);border-radius:3px 3px 0 0;min-height:3px}.fn-ax{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);direction:ltr}
.fn-six{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0 6px;text-align:center}.fn-six .b{display:flex;align-items:flex-end;justify-content:center;gap:3px;height:90px}.fn-six .b i{width:11px;border-radius:4px 4px 0 0}.fn-six small{font-size:11px;color:var(--muted)}
i.in{background:#16a37f}i.out{background:#e8556d}.fn-lg{display:flex;gap:14px;justify-content:center;font-size:12px}.fn-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-left:5px}
.fn-day{font-size:12px;color:var(--muted);margin:12px 0 4px;font-weight:700}
.fn-tx{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--line)}.fn-tx small{display:block;color:var(--muted);font-size:12px}.fn-tx .ei{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;font-size:19px}
.pos{color:#12805f}.neg{color:#c0392b}
.fn-foot{display:grid;grid-template-columns:1fr;gap:8px}
`;document.head.append(st);
})();
