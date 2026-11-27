/* Phase 2: market upgrade: photos, search, favourites, sold status, edit, message seller, report. */
const MKT=[["transport","🚌","مواصلات"],["sim","📱","شرايح"],["crafts","🛠️","صنايعية"],["restaurants","🍽️","مطاعم"],["shops","🏪","محلات"],["other","✨","أخرى"]];
const MKSUB={sim:["STC","موبايلي","زين","أخرى"],crafts:["سباك","نجار","حداد","كهربائي","نقاش","مكيفات","أخرى"],transport:["ميكروباص","ربع نقل","توصيل مشاوير","باص","أخرى"]};
const mx={tab:"transport",sub:"",q:"",favOnly:0,list:null,favs:{},busy:0,err:"",imgs:[]};
KIND_AR.market="إعلان سوق";
async function mxLoad(){
  mx.busy=1;mx.err="";
  try{
    let u="/rest/v1/market_listings?select=*&order=created_at.desc&limit=60";
    if(!mx.favOnly)u+="&tab=eq."+encodeURIComponent(mx.tab);
    if(d.country)u+="&country=eq."+encodeURIComponent(d.country);
    if(mx.sub&&!mx.favOnly)u+="&subtype=eq."+encodeURIComponent(mx.sub);
    const[r,f]=await Promise.all([sb(u),cs()?sb("/rest/v1/market_favs?select=listing_id"):[]]);
    mx.favs={};(f||[]).forEach(x=>mx.favs[x.listing_id]=1);
    mx.list=(r||[]).filter(x=>!mx.favOnly||mx.favs[x.id]);
  }catch(e){mx.err=sbErr(e);mx.list=[]}
  mx.busy=0;if(curPage()==="mkt")renderPage();
}
function mxCard(x){
  const me=(cs()||{}).uid===x.user_id,sold=x.status==="sold",imgs=(x.images||[]).filter(imgOk).slice(0,4);
  const route=x.tab==="transport"&&(x.from_place||x.to_place)?'<div class="ft">🚌 '+esc(x.from_place||"؟")+' ⟵ '+esc(x.to_place||"؟")+'</div>':"";
  const wa=x.phone&&x.whatsapp?'<a class="fb-wa" href="https://wa.me/'+esc(String(x.phone).replace(/\D/g,""))+'">واتساب</a>':"";
  return '<div class="card" style="'+(sold?"opacity:.65":"")+'"><div class="row between"><div class="ft">'+esc(x.title)+'</div>'+(sold?'<span class="pill closed">تم</span>':"")+'</div>'+route+(x.subtype?'<span class="pill">'+esc(x.subtype)+'</span>':"")+
   (imgs.length?'<div class="gal g'+imgs.length+'">'+imgs.map(u=>'<img class="fimg" loading="lazy" alt="" src="'+esc(u)+'">').join("")+'</div>':"")+
   '<p class="fb">'+esc(x.details||"")+'</p>'+(x.price?'<div class="fprice">💰 '+esc(x.price)+'</div>':"")+'<small class="muted">'+esc(x.city||"")+' · '+agoAr(x.created_at)+'</small>'+
   '<div class="fact">'+(x.phone?'<a class="fb-call" href="tel:'+esc(x.phone)+'">📞 اتصل</a>':"")+wa+(!me?'<button class="fb-chat" onclick="startDm(\''+x.user_id+'\')">💬 رسالة</button>':"")+
   '<button class="fb-call" onclick="mxFav(\''+x.id+'\')">'+(mx.favs[x.id]?"❤️":"🤍")+'</button><button class="fb-call" onclick="mxShare(\''+x.id+'\')">↗️</button>'+
   (me?'<button class="fb-call" onclick="mxSold(\''+x.id+'\',\''+(sold?"active":"sold")+'\')">'+(sold?"إعادة تفعيل":"✅ تم")+'</button><button class="fb-call" onclick="mxEdit(\''+x.id+'\')">✏️</button>':'<button class="fb-call" onclick="reportItem(\'market\',\''+x.id+'\')">🚩</button>')+
   (me||cl.admin?'<button class="fb-call" onclick="mxDel(\''+x.id+'\')">🗑</button>':"")+'</div></div>';
}
const _fi2=window.findItem;
window.findItem=function(k,id){if(k==="market"){const x=(mx.list||[]).find(x=>x.id===id+"");return x&&{author:x.user_id,snap:x.title+(x.details?" - "+x.details:""),ref:x.id}}return _fi2.apply(this,arguments)};
PAGES.mkt.render=function(){
  if(mx.list===null&&!mx.busy)setTimeout(mxLoad,0);
  const subs=MKSUB[mx.tab],q=norm(mx.q);
  let L=(mx.list||[]).filter(x=>!q||norm((x.title||"")+" "+(x.details||"")+" "+(x.subtype||"")+" "+(x.city||"")).includes(q));
  L=L.sort((a,b)=>(a.status==="sold")-(b.status==="sold"));
  return '<div class="fchips">'+MKT.map(m=>'<button class="fchip'+(!mx.favOnly&&mx.tab===m[0]?" on":"")+'" onclick="mxTab(\''+m[0]+'\')">'+m[1]+' '+m[2]+'</button>').join("")+'<button class="fchip'+(mx.favOnly?" on":"")+'" onclick="mxFavs()">❤️ المفضلة</button></div>'+
   '<input class="input" placeholder="ابحث في السوق" value="'+esc(mx.q)+'" oninput="mx.q=this.value;mxRedraw()">'+
   (subs&&!mx.favOnly?'<div class="chips">'+subs.map(s=>'<button class="chip'+(mx.sub===s?" on":"")+'" onclick="mxSub(\''+s+'\')">'+esc(s)+'</button>').join("")+'</div>':"")+
   (mx.err?'<div class="card alertbox">⚠️ '+esc(mx.err)+'</div>':"")+'<div id="mxList">'+(mx.list===null?'<div class="empty">جارِ التحميل…</div>':L.length?L.map(mxCard).join(""):'<div class="card empty"><b>لا توجد إعلانات</b></div>')+'</div>';
};
function mxRedraw(){const b=el("mxList");if(!b)return;const q=norm(mx.q);const L=(mx.list||[]).filter(x=>!q||norm((x.title||"")+" "+(x.details||"")+" "+(x.subtype||"")+" "+(x.city||"")).includes(q));b.innerHTML=L.length?L.map(mxCard).join(""):'<div class="card empty"><b>لا توجد نتائج</b></div>'}
window.mxTab=t=>{mx.tab=t;mx.sub="";mx.favOnly=0;mx.list=null;renderPage()};
window.mxSub=s=>{mx.sub=mx.sub===s?"":s;mx.list=null;renderPage()};
window.mxFavs=()=>{mx.favOnly=1;mx.list=null;renderPage()};
async function mxFav(id){
  if(!cs())return authModal("signup");
  try{if(mx.favs[id]){await sb("/rest/v1/market_favs?listing_id=eq."+id,{method:"DELETE",prefer:"return=minimal"});delete mx.favs[id]}else{await sb("/rest/v1/market_favs",{method:"POST",prefer:"return=minimal",body:{user_id:cs().uid,listing_id:id}});mx.favs[id]=1}mxRedraw()}catch(e){msg(sbErr(e).slice(0,80))}
}
function mxShare(id){const x=(mx.list||[]).find(x=>x.id===id);const t=x?x.title:"إعلان";try{navigator.share?navigator.share({title:t,url:location.origin+location.pathname}):(copyText(t+" - "+location.origin+location.pathname),msg("اتنسخ ✅"))}catch(e){}}
async function mxSold(id,st){try{await sb("/rest/v1/market_listings?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{status:st}});mx.list=null;renderPage()}catch(e){msg(sbErr(e).slice(0,80))}}
async function mxDel(id){if(!confirm("حذف الإعلان؟"))return;try{await sb("/rest/v1/market_listings?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});mx.list=null;msg("تم الحذف");renderPage()}catch(e){msg(sbErr(e).slice(0,80))}}
function mxEdit(id){
  const x=(mx.list||[]).find(x=>x.id===id);if(!x)return;
  formModal("تعديل الإعلان",inp("meT","العنوان",x.title||"",{max:80})+inp("meD","التفاصيل",x.details||"",{area:1,max:1000,rows:4})+inp("meP","السعر",x.price||"",{max:40}),async()=>{
    try{await sb("/rest/v1/market_listings?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{title:val("meT").slice(0,80),details:val("meD").slice(0,1000),price:val("meP").slice(0,40)||null}});closeModal();mx.list=null;renderPage()}catch(e){msg(sbErr(e).slice(0,80))}return!1},{save:"حفظ"});
}
/* new listing with photos (replaces mkNew) */
window.mkNew=function(){
  if(!cs())return authModal("signup");if(banStop())return;
  const t=mx.tab,subs=MKSUB[t];mx.imgs=[];
  formModal("＋ إعلان في "+(MKT.find(m=>m[0]===t)||[])[2],(t==="transport"?inp("mFrom","من (مكان)","",{max:60})+inp("mTo","إلى (مكان)","",{max:60}):"")+(subs?selF("mSub","النوع",subs,subs[0]):"")+inp("mTitle","عنوان الإعلان","",{max:80})+inp("mDet","التفاصيل","",{area:1,max:1000,rows:4})+inp("mPrice","السعر (اختياري)","",{max:40})+inp("mPhone","رقم الموبايل","",{type:"tel",mode:"tel",max:16})+chkF("mWa","رقمي عليه واتساب",true)+'<label class="lbl">صور (حتى ٤)</label><input id="mImgs" type="file" accept="image/*" multiple class="input"><p id="mErr" class="muted" style="color:#b0352d"></p>',()=>(mxSave(),!1));
};
async function mxSave(){
  const v=i=>(el(i)?el(i).value:"").trim(),t=mx.tab,title=v("mTitle")||(t==="transport"?(v("mFrom")+" إلى "+v("mTo")).trim():""),phone=v("mPhone").replace(/[^\d+]/g,"");
  if(title.length<2)return msg("اكتب عنوان للإعلان");if(!window.YOMAK_PI&&!/^[0-9+]{7,16}$/.test(phone))return msg("اكتب رقم موبايل صحيح");
  try{
    await ensureProfile();const imgs=[];const fs=[...((el("mImgs")||{}).files||[])].slice(0,4);
    for(const f of fs){if(/^image\//.test(f.type)){const u=await upImg(await gImgData(f));if(u&&u.startsWith("https://"))imgs.push(u)}}
    await sb("/rest/v1/market_listings",{method:"POST",prefer:"return=minimal",body:{tab:t,title:title.slice(0,80),details:v("mDet").slice(0,1000),from_place:v("mFrom").slice(0,60)||null,to_place:v("mTo").slice(0,60)||null,subtype:v("mSub")||null,price:v("mPrice").slice(0,40)||null,phone:phone||null,whatsapp:!!(el("mWa")&&el("mWa").checked),country:d.country==="SA"?"SA":"EG",city:(d.city||"").slice(0,40),images:imgs.length?imgs:null}});
    closeModal();mx.list=null;msg("تم نشر الإعلان");renderPage();
  }catch(e){const x=el("mErr");if(x)x.textContent="⚠️ "+sbErr(e);msg(sbErr(e).slice(0,80))}
}
