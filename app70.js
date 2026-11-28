/* v76: free error + speed tracking. Sends JS errors and load/slow-request timings to client_errors (Supabase). Admin page "errlog". Capped per session, deduped, never blocks the app. */
(function(){
const URL_=(typeof SB_URL!=="undefined"?SB_URL:null);let sent=0,seen={};const MAX=15;
function base(){try{return {build:String(window.YOMAK_BUILD||""),page:String(typeof current!=="undefined"?current:""),ua:(navigator.userAgent||"").slice(0,160)}}catch(e){return {}}}
function post(o){try{if(sent>=MAX||!URL_)return;const k=o.kind+"|"+(o.msg||"").slice(0,80);if(seen[k])return;seen[k]=1;sent++;
 const b=Object.assign(base(),o);if(b.msg)b.msg=String(b.msg).slice(0,380);if(b.stack)b.stack=String(b.stack).slice(0,1400);
 const h={"Content-Type":"application/json",apikey:SB_KEY,Prefer:"return=minimal"};try{const s=JSON.parse(localStorage.getItem(SB_LS)||"null");if(s&&s.access)h.Authorization="Bearer "+s.access;else h.Authorization="Bearer "+SB_KEY}catch(e){h.Authorization="Bearer "+SB_KEY}
 window.__origFetch(URL_+"/rest/v1/client_errors",{method:"POST",headers:h,body:JSON.stringify(b),keepalive:true}).catch(()=>{})}catch(e){}}
window.__origFetch=window.fetch.bind(window);
addEventListener("error",e=>{if(!e.message||/ResizeObserver|Script error/.test(e.message))return;post({kind:"error",msg:e.message,src:(e.filename||"").split("/").pop()+":"+e.lineno,stack:e.error&&e.error.stack})});
addEventListener("unhandledrejection",e=>{const r=e.reason;const m=r&&r.message?r.message:String(r);if(/AbortError|Failed to fetch|NetworkError|Load failed/.test(m))return;post({kind:"promise",msg:m,stack:r&&r.stack})});
/* slow requests (>4s) to our API */
const f0=window.fetch;window.fetch=function(u,o){const t=Date.now(),us=String(u&&u.url||u);return f0.apply(this,arguments).then(r=>{const d=Date.now()-t;if(d>4000&&URL_&&us.indexOf(URL_)===0&&us.indexOf("client_errors")<0)post({kind:"slow",msg:us.replace(URL_,"").split("?")[0],ms:d});return r})};
addEventListener("load",()=>setTimeout(()=>{try{const n=performance.getEntriesByType("navigation")[0];if(n&&Math.random()<.2)post({kind:"perf",msg:"load",ms:Math.round(n.loadEventEnd)})}catch(e){}},3000));
if(typeof PAGES==="undefined")return;
const esc_=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
PAGES.errlog={title:()=>"🐞 الأخطاء والسرعة",render:()=>{const L=window.__errs;if(!L)return '<p class="muted">جاري التحميل…</p>';
 const e=L.filter(x=>x.kind==="error"||x.kind==="promise"),s=L.filter(x=>x.kind==="slow"),p=L.filter(x=>x.kind==="perf");
 const avg=p.length?Math.round(p.reduce((a,x)=>a+(x.ms||0),0)/p.length):0;
 return '<div class="card"><b>آخر 200 تسجيل</b><br>أخطاء: '+e.length+' · طلبات بطيئة: '+s.length+' · متوسط تحميل الصفحة: '+(avg?(avg/1000).toFixed(1)+"ث":"—")+'</div>'+
 L.filter(x=>x.kind!=="perf").slice(0,60).map(x=>'<div class="card"><b>'+(x.kind==="slow"?"🐢 بطيء "+(x.ms/1000).toFixed(1)+"ث":"⚠️ خطأ")+'</b> <small class="muted">'+new Date(x.at).toLocaleString("ar-EG")+' · v'+esc_(x.build)+' · '+esc_(x.page)+'</small><div dir="ltr" style="font-size:12px;word-break:break-all">'+esc_(x.msg)+(x.src?" @ "+esc_(x.src):"")+'</div></div>').join("")||'<p class="muted">مفيش أخطاء مسجلة 🎉</p>'+
 '<button class="secondary" onclick="ykClearErrs()">🗑️ مسح السجل</button>'},
 after:()=>{if(window.__errs===undefined||Date.now()-(window.__errTs||0)>20000){window.__errTs=Date.now();sb("/rest/v1/client_errors?select=*&order=at.desc&limit=200").then(r=>{window.__errs=r||[];try{renderPage()}catch(e){}}).catch(()=>{window.__errs=[]})}}};
window.ykClearErrs=async function(){if(!confirm("مسح كل السجل؟"))return;try{await sb("/rest/v1/client_errors?id=gt.0",{method:"DELETE"});window.__errs=[];renderPage()}catch(e){msg("تعذر المسح")}};
const o=PAGES.admin.render;
PAGES.admin.render=function(){const r=o.apply(this,arguments);return cl.admin?'<button class="secondary" style="margin-bottom:10px" onclick="openPage(\'errlog\')">🐞 الأخطاء والسرعة</button>'+r:r}
})();
