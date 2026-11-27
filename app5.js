/* YOMAK v7: expenses (day/week/month + PDF) and market tabs */
(function(){
const MT=[["transport","🚌","مواصلات"],["sim","📱","شرايح"],["crafts","🛠️","صنايعية"],["restaurants","🍽️","مطاعم"],["shops","🏪","محلات"],["other","✨","أخرى"]];
const SUB={sim:["STC","موبايلي","زين","أخرى"],crafts:["سباك","نجار","حداد","كهربائي","نقاش","مكيفات","أخرى"],transport:["ميكروباص","ربع نقل","توصيل مشاوير","باص","أخرى"]};
let mk={tab:"transport",list:null,busy:false,err:"",sub:""};
const q=s=>encodeURIComponent(s);
async function mkLoad(){
  mk.busy=true;mk.err="";
  try{
    let u="/rest/v1/market_listings?select=*&order=created_at.desc&limit=40&tab=eq."+q(mk.tab);
    if(d.country)u+="&country=eq."+q(d.country);
    if(mk.sub)u+="&subtype=eq."+q(mk.sub);
    const r=await sbRaw(u,{});
    mk.list=Array.isArray(r)?r:[];
  }catch(e){mk.err=sbErr(e);mk.list=[]}
  mk.busy=false;renderPage();
}
window.mkTab=t=>{mk.tab=t;mk.sub="";mk.list=null;renderPage()};
window.mkSub=s=>{mk.sub=mk.sub===s?"":s;mk.list=null;renderPage()};
function card(x){
  const route=x.tab==="transport"&&(x.from_place||x.to_place)?`<div class="ft">🚌 ${esc(x.from_place||"؟")} ⟵ ${esc(x.to_place||"؟")}</div>`:"";
  const me=(cs()||{}).uid===x.user_id;
  const wa=x.phone&&x.whatsapp?`<a class="fb-wa" href="https://wa.me/${esc(String(x.phone).replace(/\D/g,""))}">واتساب</a>`:"";
  return `<div class="card"><div class="ft">${esc(x.title)}</div>${route}${x.subtype?`<span class="pill">${esc(x.subtype)}</span>`:""}<p class="fb">${esc(x.details||"")}</p>${x.price?`<div class="fprice">💰 ${esc(x.price)}</div>`:""}<small class="muted">${esc(x.city||"")}</small><div class="fact">${x.phone?`<a class="fb-call" href="tel:${esc(x.phone)}">📞 اتصل</a>`:""}${wa}${me?`<button class="fb-call" onclick="mkDel('${esc(x.id)}')">🗑 حذف</button>`:""}</div></div>`;
}
window.mkDel=async id=>{
  if(!UUID_RE.test(id)||!confirm("حذف الإعلان؟"))return;
  try{await sb("/rest/v1/market_listings?id=eq."+id,{method:"DELETE"});mk.list=null;msg("تم الحذف");renderPage()}catch(e){msg(sbErr(e).slice(0,80))}
};
window.mkNew=()=>{
  if(!cs())return authModal("signup");
  if(typeof banStop==="function"&&banStop())return;
  const t=mk.tab,subs=SUB[t];
  formModal("＋ إعلان في "+(MT.find(m=>m[0]===t)||[])[2],
    (t==="transport"?inp("mFrom","من (مكان)","",{max:60})+inp("mTo","إلى (مكان)","",{max:60}):"")+
    (subs?selF("mSub","النوع",subs,subs[0]):"")+
    inp("mTitle","عنوان الإعلان","",{max:80})+
    inp("mDet","التفاصيل (مواعيد، منطقة، شروط…)","",{area:1,max:1000,rows:4})+
    inp("mPrice","السعر (اختياري)","",{max:40})+
    inp("mPhone","رقم الموبايل","",{type:"tel",mode:"tel",max:16})+
    chkF("mWa","رقمي عليه واتساب",true)+'<p id="mErr" class="muted" style="color:#b0352d"></p>',
    ()=>{mkSave();return false});
};
async function mkSave(){
  const v=i=>(el(i)?el(i).value:"").trim(),t=mk.tab;
  const title=v("mTitle")||(t==="transport"?(v("mFrom")+" إلى "+v("mTo")).trim():"");
  const phone=v("mPhone").replace(/[^\d+]/g,"");
  if(title.length<2)return msg("اكتب عنوان للإعلان");
  if(!window.YOMAK_PI&&!/^[0-9+]{7,16}$/.test(phone))return msg("اكتب رقم موبايل صحيح");
  try{
    await ensureProfile();
    await sb("/rest/v1/market_listings",{method:"POST",body:{tab:t,title:title.slice(0,80),details:v("mDet").slice(0,1000),from_place:v("mFrom").slice(0,60)||null,to_place:v("mTo").slice(0,60)||null,subtype:v("mSub")||null,price:v("mPrice").slice(0,40)||null,phone:phone||null,whatsapp:!!(el("mWa")&&el("mWa").checked),country:d.country==="SA"?"SA":"EG",city:(d.city||"").slice(0,40)}});
    closeModal();mk.list=null;msg("تم نشر الإعلان");renderPage();
  }catch(e){const x=el("mErr");if(x)x.textContent="⚠️ "+sbErr(e);msg(sbErr(e).slice(0,80))}
}
PAGES.mkt={title:()=>"السوق 🛍️",act:()=>'<button class="pact" onclick="mkNew()">＋ إعلان</button>',render:()=>{
  if(mk.list===null&&!mk.busy)setTimeout(mkLoad,0);
  const subs=SUB[mk.tab];
  return `<div class="fchips">${MT.map(m=>`<button class="fchip${mk.tab===m[0]?" on":""}" onclick="mkTab('${m[0]}')">${m[1]} ${m[2]}</button>`).join("")}</div>`+
   (subs?`<div class="chips">${subs.map(s=>`<button class="chip${mk.sub===s?" on":""}" onclick="mkSub('${s}')">${esc(s)}</button>`).join("")}</div>`:"")+
   (mk.err?`<div class="card alertbox">⚠️ ${esc(mk.err)}</div>`:"")+
   (mk.list===null?'<div class="empty">جارِ التحميل…</div>':mk.list.length?mk.list.map(card).join(""):'<div class="card empty"><b>لا توجد إعلانات بعد</b><p class="muted">كن أول من ينشر هنا.</p></div>')}};
HUB.unshift(["mkt","🛍️","السوق"]);
const oldHub=window.servicesHub;
window.servicesHub=function(){return '<div class="section" style="margin-top:0"><h3>السوق</h3></div>'+hubGrid(["mkt"])+oldHub()};

/* ---------- expenses ---------- */
function dayKey(dt){return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`}
function weekStart(){const n=new Date(),dd=new Date(n.getFullYear(),n.getMonth(),n.getDate());dd.setDate(dd.getDate()-((dd.getDay()+1)%7));return dd}// week starts Saturday
function sumFrom(k0,k1){return d.expenses.filter(e=>e.currency===cur()&&e.date>=k0&&e.date<=k1).reduce((a,e)=>a+Number(e.amount),0)}
function monthDays(){const n=new Date();return new Date(n.getFullYear(),n.getMonth()+1,0).getDate()}
function periods(){
  const t=todayKey(),m=t.slice(0,7),ws=dayKey(weekStart()),b=budgetVal(),dim=monthDays();
  return [["اليوم",sumFrom(t,t),b?b/dim:0],["الأسبوع",sumFrom(ws,t),b?b/dim*7:0],["الشهر",sumFrom(m+"-01",m+"-31"),b]];
}
function pRow(p){
  const [n,s,b]=p,pc=b?Math.min(100,Math.round(s/b*100)):0;
  return `<div style="margin:10px 0"><div class="row between"><b>${n}</b><span>${cash(s)}${b?" من "+cash(b):""}</span></div>${b?`<div class="progress" style="background:#e7efeb"><span class="${s>b?"over":""}" style="width:${pc}%"></span></div><small class="muted">${s>b?"⚠ تجاوزت بمقدار "+cash(s-b):"المتبقي "+cash(b-s)}</small>`:'<small class="muted">حدد ميزانية الشهر علشان تظهر هنا</small>'}</div>`;
}
const oldExp=window.expenses;
window.expenses=function(){
  return `<div class="title">مصروفاتي 💰</div><p class="desc">اكتب ميزانيتك وسجّل كل مصروف. اضغط على أي مصروف لتعديله.</p><div class="card">${periods().map(pRow).join("")}<button class="secondary" onclick="budgetModal()">🎯 ميزانية الشهر</button></div><button class="primary" onclick="expenseModal()">＋ سجّل مصروف</button><button class="secondary" style="margin-top:8px" onclick="expPdf()">📄 تقرير PDF للشهر</button><div class="section"><h3>آخر المصروفات</h3></div><div class="list">${d.expenses.slice().reverse().slice(0,60).map(expItem).join("")||'<div class="empty">لا توجد مصروفات مسجلة</div>'}</div>`;
};
// minimal PDF writer: report drawn on canvas (Arabic shaping by the browser), embedded as JPEG
window.expPdf=async function(){
  const m=todayKey().slice(0,7),rows=d.expenses.filter(e=>e.currency===cur()&&String(e.date).startsWith(m)).sort((a,b)=>a.date<b.date?-1:1);
  if(!rows.length)return msg("لا توجد مصروفات هذا الشهر");
  const W=1240,H=1754,L=44,pages=[];let cv,cx,y;
  const np=()=>{cv=document.createElement("canvas");cv.width=W;cv.height=H;cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,W,H);cx.direction="rtl";cx.textAlign="right";cx.fillStyle="#123c3a";cx.font="bold 44px Tahoma,Arial,sans-serif";y=110;pages.push(cv)};
  np();cx.fillText("تقرير مصروفات يومك · "+m,W-L,y);y+=60;
  cx.font="30px Tahoma,Arial,sans-serif";
  const tot=rows.reduce((a,e)=>a+Number(e.amount),0),b=budgetVal();
  cx.fillText("الإجمالي: "+cash(tot)+(b?"   الميزانية: "+cash(b)+"   "+(tot>b?"تجاوز: "+cash(tot-b):"المتبقي: "+cash(b-tot)):""),W-L,y);y+=70;
  for(const e of rows){
    if(y>H-90){np();cx.font="30px Tahoma,Arial,sans-serif"}
    cx.fillStyle="#123c3a";cx.fillText(e.date+"  ·  "+e.title+" ("+e.cat+")",W-L,y);
    cx.textAlign="left";cx.fillText(cash(e.amount),L,y);cx.textAlign="right";
    cx.strokeStyle="#e5ece8";cx.beginPath();cx.moveTo(L,y+16);cx.lineTo(W-L,y+16);cx.stroke();y+=52;
  }
  const jp=pages.map(c=>{const s=atob(c.toDataURL("image/jpeg",.85).split(",")[1]),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a});
  const enc=new TextEncoder(),parts=[],off=[];let len=0;
  const put=x=>{const u=typeof x==="string"?enc.encode(x):x;parts.push(u);len+=u.length};
  const n=jp.length;put("%PDF-1.4\n");
  const obj=(i,f)=>{off[i]=len;put(i+" 0 obj\n");f();put("\nendobj\n")};
  obj(1,()=>put("<</Type/Catalog/Pages 2 0 R>>"));
  obj(2,()=>put("<</Type/Pages/Count "+n+"/Kids["+jp.map((_,i)=>(3+i*3)+" 0 R").join(" ")+"]>>"));
  jp.forEach((a,i)=>{const p=3+i*3,im=p+1,ct=p+2,cs_="q 595 0 0 842 0 0 cm /Im0 Do Q";
    obj(p,()=>put("<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</XObject<</Im0 "+im+" 0 R>>>>/Contents "+ct+" 0 R>>"));
    obj(im,()=>{put("<</Type/XObject/Subtype/Image/Width "+W+"/Height "+H+"/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length "+a.length+">>\nstream\n");put(a);put("\nendstream")});
    obj(ct,()=>put("<</Length "+cs_.length+">>\nstream\n"+cs_+"\nendstream"))});
  const xo=len,tn=3+n*3;put("xref\n0 "+tn+"\n0000000000 65535 f \n");
  for(let i=1;i<tn;i++)put(String(off[i]).padStart(10,"0")+" 00000 n \n");
  put("trailer\n<</Size "+tn+"/Root 1 0 R>>\nstartxref\n"+xo+"\n%%EOF");
  const blob=new Blob(parts,{type:"application/pdf"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="yomak-expenses-"+m+".pdf";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),6e4);msg("تم حفظ التقرير");
};

/* ---------- expense sync (phone + account) ---------- */
const XK=()=>"yomak_xsync_"+((cs()||{}).uid||"");
const ldMap=()=>{try{return JSON.parse(localStorage.getItem(XK())||"{}")}catch(e){return{}}};
const svMap=m=>{try{localStorage.setItem(XK(),JSON.stringify(m))}catch(e){}};
const sig=e=>[e.title,e.cat,Number(e.amount),e.currency,e.date].join("|");
const toRow=e=>({title:String(e.title||e.cat).slice(0,60),cat:String(e.cat).slice(0,40),amount:Number(e.amount),currency:e.currency,spent_on:e.date});
const rsig=r=>[r.title,r.cat,Number(r.amount),r.currency,r.spent_on].join("|");
let xBusy=false,xLast=0,xTimer=null;
async function xSync(){
  if(xBusy||!cs()||!navigator.onLine)return;
  xBusy=true;let changed=false;
  try{
    const rem=await sb("/rest/v1/user_expenses?select=*&order=created_at.asc&limit=5000"),rm={};
    (rem||[]).forEach(r=>rm[r.id]=r);
    const m=ldMap(),seen=new Set();
    for(const lid of Object.keys(m)){
      const ent=m[lid],loc=d.expenses.find(e=>String(e.id)===lid),r=rm[ent.u];
      if(!loc){if(r)await sb("/rest/v1/user_expenses?id=eq."+ent.u,{method:"DELETE"});delete m[lid];continue}
      seen.add(String(loc.id));
      if(!r){tx(()=>{d.expenses=d.expenses.filter(e=>String(e.id)!==lid)});delete m[lid];changed=true;continue}
      const ls=sig(loc),rs=rsig(r);
      if(ls!==ent.s){await sb("/rest/v1/user_expenses?id=eq."+ent.u,{method:"PATCH",body:toRow(loc)});ent.s=ls}
      else if(rs!==ent.s){tx(()=>{const e=d.expenses.find(e=>String(e.id)===lid);e.title=r.title;e.cat=CATS.includes(r.cat)?r.cat:"أخرى";e.amount=Number(r.amount);e.currency=r.currency;e.date=r.spent_on});ent.s=rs;changed=true}
    }
    const known=new Set(Object.values(m).map(x=>x.u));
    for(const r of (rem||[])){
      if(known.has(r.id))continue;
      const id=newId();
      tx(()=>{d.expenses.push({id,title:r.title,cat:CATS.includes(r.cat)?r.cat:"أخرى",amount:Number(r.amount),currency:r.currency,date:r.spent_on})});
      m[id]={u:r.id,s:rsig(r)};changed=true;
    }
    const mapped=new Set(Object.keys(m));
    for(const e of d.expenses.slice()){
      if(mapped.has(String(e.id)))continue;
      const u=crypto.randomUUID();
      await ensureProfile();
      await sb("/rest/v1/user_expenses",{method:"POST",body:{id:u,...toRow(e)}});
      m[e.id]={u,s:sig(e)};
    }
    svMap(m);
    // budgets
    const bl=await sb("/rest/v1/user_budgets?select=currency,monthly"),br={};
    (bl||[]).forEach(b=>br[b.currency]=Number(b.monthly));
    const bs=JSON.parse(localStorage.getItem(XK()+"_b")||"{}");
    for(const c of ["EGP","SAR"]){
      const L=Number(d.budgets&&d.budgets[c]||0),R=br[c],S=bs[c];
      if(L>0&&L!==S&&L!==R){await sb("/rest/v1/user_budgets?on_conflict=user_id,currency",{method:"POST",prefer:"resolution=merge-duplicates",body:{currency:c,monthly:L}});bs[c]=L}
      else if(R!==undefined&&R!==L&&L===(S||0)){tx(()=>{d.budgets[c]=R;if(c===cur())d.budget=R});bs[c]=R;changed=true}
      else if(R!==undefined)bs[c]=R;
    }
    localStorage.setItem(XK()+"_b",JSON.stringify(bs));
    xLast=Date.now();
  }catch(e){console.warn("expense sync",e)}
  xBusy=false;
  if(changed)try{render()}catch(e){}
}
window.xSync=xSync;
const later=()=>{clearTimeout(xTimer);xTimer=setTimeout(xSync,800)};
["saveExpense","deleteExpense","saveBudget"].forEach(n=>{const f=window[n];if(typeof f!=="function")return;window[n]=function(){const r=f.apply(this,arguments);later();return r}});
const expBase=window.expenses;
window.expenses=function(){if(cs()&&Date.now()-xLast>60000&&!xBusy)later();return expBase()};
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&cs()&&Date.now()-xLast>60000)later()});
setTimeout(()=>{if(cs())xSync()},3000);
})();
