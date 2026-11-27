/* Phase 5: full Marketplace tab (own bottom tab): categories, filters, sort, details, seller, favourites, my listings, sell flow, similar, report. */
const MKC=[
 ["vehicles","🚗","سيارات ومركبات",["سيارات","دراجات نارية","ربع نقل وشاحنات","قطع غيار","أخرى"]],
 ["realestate","🏠","عقارات",["شقق للإيجار","شقق للبيع","فلل ومنازل","أراضي","محلات ومكاتب","سكن مشترك"]],
 ["phones","📱","موبايلات وتابلت",["موبايلات","تابلت","إكسسوارات","شرايح وأرقام"]],
 ["electronics","💻","إلكترونيات",["لابتوب وكمبيوتر","تلفزيونات وشاشات","ألعاب فيديو","كاميرات","صوتيات"]],
 ["home","🛋️","أثاث ومنزل",["أثاث","أجهزة كهربائية","مطبخ","ديكور","أدوات منزلية"]],
 ["fashion","👗","أزياء وموضة",["رجالي","نسائي","أطفال","أحذية وشنط","ساعات ومجوهرات"]],
 ["kids","🧸","أطفال وألعاب",["ألعاب","مستلزمات رضع","عربات وكراسي","ملابس أطفال"]],
 ["sports","⚽","رياضة وهوايات",["معدات رياضية","دراجات هوائية","رحلات وتخييم","آلات موسيقية"]],
 ["books","📚","كتب ودراسة",["كتب","مستلزمات دراسية","كورسات ودروس"]],
 ["pets","🐾","حيوانات أليفة",["قطط","كلاب","طيور","مستلزمات"]],
 ["services","🛠️","خدمات وصنايعية",["سباك","كهربائي","نجار","نقاش","مكيفات","مواصلات وتوصيل","نقل أثاث","أخرى"]],
 ["food","🍽️","أكل ومطاعم",["مطاعم","أكل بيت","حلويات","توصيل"]],
 ["shops","🏪","محلات",["بقالة","ملابس","إلكترونيات","أخرى"]],
 ["tools","🔧","معدات وأدوات",["عدد يدوية","معدات بناء","معدات مزارع","ماكينات"]],
 ["other","✨","أخرى",[]]
];
const MKLEG={transport:["services","مواصلات وتوصيل"],sim:["phones","شرايح وأرقام"],crafts:["services","أخرى"],restaurants:["food","مطاعم"],shops:["shops",""],other:["other",""],general:["other",""]};
const MKCOND=[["new","جديد"],["like_new","شبه جديد"],["used","مستعمل"],["fair","مقبول"]];
const MKSORT=[["new","الأحدث"],["pa","السعر: الأقل"],["pd","السعر: الأعلى"],["views","الأكثر مشاهدة"]];
const MKDATE=[["","أي وقت"],["1","آخر ٢٤ ساعة"],["7","آخر أسبوع"],["30","آخر شهر"]];
const mk={cat:"",sub:"",q:"",min:"",max:"",city:"",cond:"",date:"",sort:"new",fav:0,list:null,favs:{},busy:0,err:"",loadedAt:0,reps:{}};
const mkCat=id=>MKC.find(c=>c[0]===id)||MKC[MKC.length-1];
const mkCatOf=x=>x.category?x.category:(MKLEG[x.tab]||["other",""])[0];
const mkSubOf=x=>x.subcategory||(x.category?"":(MKLEG[x.tab]||["",""])[1]);
const mkCur=()=>d.country==="SA"?"ر.س":"ج.م";
function mkPrice(x){
  if(x.price_num!=null&&x.price_num!=="")return Number(x.price_num)===0?"مجاني":an(Number(x.price_num).toLocaleString("en-US"))+" "+((x.country||d.country)==="SA"?"ر.س":"ج.م");
  return x.price?String(x.price):"اتفاق";
}
function mkImgs(x){return(x.images||[]).filter(imgOk)}
async function mkLoad(force){
  if(mk.busy)return;mk.busy=1;mk.err="";
  try{
    let u="/rest/v1/market_listings?select=*&order=created_at.desc&limit=300";
    if(d.country)u+="&country=eq."+encodeURIComponent(d.country);
    const[r,f]=await Promise.all([sb(u),cs()?sb("/rest/v1/market_favs?select=listing_id").catch(()=>[]):[]]);
    mk.favs={};(f||[]).forEach(x=>mk.favs[x.listing_id]=1);
    mk.list=r||[];mk.loadedAt=Date.now();
    try{await loadPeople(mk.list.map(x=>x.user_id).slice(0,80))}catch(e){}
  }catch(e){mk.err=sbErr(e);mk.list=mk.list||[]}
  mk.busy=0;mkRefresh();
}
function mkRefresh(){if(current==="market"){render()}else if(["mkitem","mkmine"].includes(curPage()))renderPage()}
function mkFiltered(){
  const q=norm(mk.q),now=Date.now();
  let L=(mk.list||[]).filter(x=>{
    if(mk.fav&&!mk.favs[x.id])return false;
    if(mk.cat&&mkCatOf(x)!==mk.cat)return false;
    if(mk.sub&&mkSubOf(x)!==mk.sub)return false;
    if(q&&!norm((x.title||"")+" "+(x.details||"")+" "+mkSubOf(x)+" "+(x.city||"")+" "+(x.district||"")).includes(q))return false;
    if(mk.city&&!norm(x.city||"").includes(norm(mk.city)))return false;
    if(mk.cond&&x.condition!==mk.cond)return false;
    if(mk.date&&now-new Date(x.created_at).getTime()>Number(mk.date)*864e5)return false;
    const p=x.price_num!=null?Number(x.price_num):null;
    if(mk.min!==""&&(p===null||p<Number(mk.min)))return false;
    if(mk.max!==""&&(p===null||p>Number(mk.max)))return false;
    return true;
  });
  const key={new:(a,b)=>new Date(b.created_at)-new Date(a.created_at),pa:(a,b)=>(a.price_num==null)-(b.price_num==null)||a.price_num-b.price_num,pd:(a,b)=>(a.price_num==null)-(b.price_num==null)||b.price_num-a.price_num,views:(a,b)=>(b.views||0)-(a.views||0)}[mk.sort]||0;
  L=L.sort((a,b)=>(a.status==="sold")-(b.status==="sold")||(key?key(a,b):0));
  return L;
}
function mkFilterCount(){return["min","max","city","cond","date"].filter(k=>mk[k]!=="").length+(mk.sort!=="new"?1:0)}
function mkCard(x){
  const im=mkImgs(x)[0],sold=x.status==="sold",c=mkCat(mkCatOf(x));
  return '<div class="mkc" onclick="mkOpen(\''+x.id+'\')"><div class="mki"'+(im?' style="background-image:url(\''+esc(im)+'\')"':"")+'>'+(im?"":'<span>'+c[1]+'</span>')+(sold?'<b class="mks">تم البيع</b>':"")+
   '<button class="mkh" aria-label="مفضلة" onclick="event.stopPropagation();mkFav(\''+x.id+'\')">'+(mk.favs[x.id]?"❤️":"🤍")+'</button></div><div class="mkp">'+esc(mkPrice(x))+'</div><div class="mkt">'+esc(x.title)+'</div><small class="muted">'+esc(x.city||"")+(x.city?" · ":"")+agoAr(x.created_at)+'</small></div>';
}
const mkCss=document.createElement("style");
mkCss.textContent=".mkhd{display:flex;align-items:center;gap:6px;margin:2px 0 8px}.mkhd h3{flex:1;margin:0;font-size:20px;color:var(--g,#155b50)}.mkhd button{border:0;background:#e8eeec;border-radius:20px;min-height:38px;padding:0 12px;font:inherit;font-weight:700;font-size:13px}.mkhd .sell{background:var(--g,#155b50);color:#fff}"+
".mksr{display:flex;gap:6px;margin-bottom:8px}.mksr input{flex:1}.mksr button{border:0;background:#fff;border:1px solid var(--line,#ddd);border-radius:12px;min-width:46px;font-size:18px;position:relative}.mksr .n{position:absolute;top:-6px;left:-4px;background:#d32f2f;color:#fff;border-radius:9px;font-size:10px;padding:1px 5px}"+
".mkcats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.mkcat{border:1px solid var(--line,#e3e8e6);background:#fff;border-radius:16px;padding:12px 4px;font:inherit;text-align:center;min-height:86px}.mkcat span{display:block;font-size:28px}.mkcat b{display:block;font-size:12px;margin-top:4px;line-height:1.25}"+
".mkg{display:grid;grid-template-columns:1fr 1fr;gap:10px}.mkc{background:#fff;border:1px solid var(--line,#e3e8e6);border-radius:14px;overflow:hidden;padding-bottom:8px;cursor:pointer}.mki{position:relative;aspect-ratio:1/1;background:#e8eeec center/cover;display:grid;place-items:center;font-size:44px}.mkp{font-weight:800;padding:6px 8px 0;color:var(--g,#155b50)}.mkt{padding:0 8px;font-size:13px;line-height:1.3;max-height:34px;overflow:hidden}.mkc small{padding:0 8px;display:block}"+
".mkh{position:absolute;top:6px;left:6px;width:34px;height:34px;border-radius:50%;border:0;background:#fffc;font-size:16px}.mks{position:absolute;bottom:6px;right:6px;background:#222c;color:#fff;font-size:11px;padding:2px 8px;border-radius:8px}"+
".mkbc{display:flex;gap:6px;align-items:center;margin:4px 0 8px;flex-wrap:wrap}.mkbc button{border:0;background:none;font:inherit;color:var(--g,#155b50);font-weight:700;padding:0}.mkact{display:flex;gap:6px;overflow-x:auto;margin-bottom:8px;scrollbar-width:none}.mkact::-webkit-scrollbar{display:none}"+
".mkgal{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:0;border-radius:14px;background:#e8eeec;margin-bottom:10px}.mkgal img{flex:0 0 100%;scroll-snap-align:center;aspect-ratio:4/3;object-fit:contain;background:#111}.mkgal .ph{flex:0 0 100%;aspect-ratio:4/3;display:grid;place-items:center;font-size:80px}"+
".mkprice{font-size:24px;font-weight:800;color:var(--g,#155b50)}.mkmeta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}.mkmeta div{background:#f3f6f5;border-radius:10px;padding:8px;font-size:13px}.mkmeta small{display:block;color:var(--muted,#667)}"+
".mkslr{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line,#e3e8e6);border-radius:14px;padding:10px;margin:10px 0}.mkslr .pb{flex:1}.mkcta{display:flex;gap:6px;margin:10px 0}.mkcta>*{flex:1;text-align:center;border:0;border-radius:12px;min-height:46px;display:grid;place-items:center;font:inherit;font-weight:700;text-decoration:none;background:var(--g,#155b50);color:#fff}.mkcta .alt{background:#e8eeec;color:var(--g,#155b50)}"+
".mkrow{display:flex;gap:8px;margin-bottom:8px}.mkrow>*{flex:1}.mkimgs{display:flex;gap:6px;overflow-x:auto;margin:6px 0}.mkimgs img{width:64px;height:64px;object-fit:cover;border-radius:10px}";
document.head.append(mkCss);
window.mkTab=function(){
  if(mk.list===null&&!mk.busy)setTimeout(mkLoad,0);
  else if(mk.list&&Date.now()-mk.loadedAt>6e4&&!mk.busy)setTimeout(mkLoad,0);
  const fc=mkFilterCount(),browsing=mk.cat||mk.q||fc||mk.fav,c=mk.cat?mkCat(mk.cat):null;
  let h='<div class="mkhd"><h3>🛍️ السوق</h3><button onclick="mkFavsToggle()">'+(mk.fav?"❤️ المفضلة ✓":"❤️")+'</button><button onclick="openPage(\'mkmine\')">📋 إعلاناتي</button><button class="sell" onclick="mkSell()">＋ بيع</button></div>'+
   '<div class="mksr"><input class="input" id="mkQ" placeholder="ابحث في السوق" value="'+esc(mk.q)+'" oninput="mk.q=this.value;mkRedrawList()"><button aria-label="فلاتر" onclick="mkFilters()">🎚️'+(fc?'<i class="n">'+an(fc)+'</i>':"")+'</button></div>';
  if(mk.err)h+='<div class="card alertbox">⚠️ '+esc(mk.err)+'</div>';
  if(!browsing){
    h+='<div class="mkcats">'+MKC.map(c=>'<button class="mkcat" onclick="mkPick(\''+c[0]+'\')"><span>'+c[1]+'</span><b>'+c[2]+'</b></button>').join("")+'</div><h4 style="margin:6px 2px">أحدث الإعلانات</h4>';
  }else{
    h+='<div class="mkbc"><button onclick="mkClear()">السوق</button>'+(c?' › <button onclick="mkPick(\''+c[0]+'\')">'+c[1]+' '+c[2]+'</button>':"")+(mk.fav?" › ❤️ المفضلة":"")+(mk.sub?" › <b>"+esc(mk.sub)+"</b>":"")+'</div>';
    if(c&&c[3].length)h+='<div class="mkact">'+c[3].map(s=>'<button class="fchip'+(mk.sub===s?" on":"")+'" onclick="mkSub(\''+s+'\')">'+esc(s)+'</button>').join("")+'</div>';
  }
  return h+'<div id="mkList">'+mkListHtml()+'</div>';
};
function mkListHtml(){
  if(mk.list===null)return'<div class="empty">جارِ التحميل…</div>';
  const L=mkFiltered();
  return L.length?'<div class="mkg">'+L.map(mkCard).join("")+'</div>':'<div class="card empty"><b>لا توجد إعلانات مطابقة</b><p class="muted">جرّب تغيير الفلاتر أو البحث، أو كن أول من ينشر.</p><button class="primary" onclick="mkSell()">＋ أضف إعلان</button></div>';
}
window.mkRedrawList=()=>{const b=el("mkList");if(b)b.innerHTML=mkListHtml()};
window.mkPick=id=>{mk.cat=id;mk.sub="";mk.fav=0;render()};
window.mkSub=s=>{mk.sub=mk.sub===s?"":s;render()};
window.mkClear=()=>{Object.assign(mk,{cat:"",sub:"",q:"",min:"",max:"",city:"",cond:"",date:"",sort:"new",fav:0});render()};
window.mkFavsToggle=()=>{if(!cs())return authModal("signup");mk.fav=mk.fav?0:1;render()};
window.mkFilters=function(){
  const opt=(a,v)=>a.map(o=>'<option value="'+o[0]+'"'+(String(v)===o[0]?" selected":"")+'>'+o[1]+'</option>').join("");
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>🎚️ الفلاتر والترتيب</h3>'+
   '<label class="lbl">السعر ('+mkCur()+')</label><div class="mkrow"><input id="fMin" class="input" inputmode="numeric" placeholder="من" value="'+esc(mk.min)+'"><input id="fMax" class="input" inputmode="numeric" placeholder="إلى" value="'+esc(mk.max)+'"></div>'+
   '<label class="lbl">المدينة</label><input id="fCity" class="input" placeholder="مثال: '+esc(d.city||"بريدة")+'" value="'+esc(mk.city)+'">'+
   '<label class="lbl">الحالة</label><select id="fCond" class="input"><option value="">أي حالة</option>'+opt(MKCOND,mk.cond)+'</select>'+
   '<label class="lbl">تاريخ النشر</label><select id="fDate" class="input">'+opt(MKDATE,mk.date)+'</select>'+
   '<label class="lbl">الترتيب</label><select id="fSort" class="input">'+opt(MKSORT,mk.sort)+'</select>'+
   '<div class="row" style="margin-top:12px"><button class="primary" onclick="mkApply()">عرض النتائج</button><button class="secondary" onclick="mkReset()">مسح الفلاتر</button></div>');
};
const mkNum=s=>{s=String(s||"").replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/[^\d.]/g,"");return s};
window.mkApply=()=>{mk.min=mkNum(val("fMin"));mk.max=mkNum(val("fMax"));mk.city=val("fCity");mk.cond=val("fCond");mk.date=val("fDate");mk.sort=val("fSort")||"new";closeModal();render()};
window.mkReset=()=>{Object.assign(mk,{min:"",max:"",city:"",cond:"",date:"",sort:"new"});closeModal();render()};
async function mkFav(id){
  if(!cs())return authModal("signup");
  try{if(mk.favs[id]){await sb("/rest/v1/market_favs?listing_id=eq."+id,{method:"DELETE",prefer:"return=minimal"});delete mk.favs[id]}else{await sb("/rest/v1/market_favs",{method:"POST",prefer:"return=minimal",body:{user_id:cs().uid,listing_id:id}});mk.favs[id]=1}
    if(curPage()==="mkitem")renderPage();else if(mk.fav)render();else mkRedrawList()}catch(e){msg(sbErr(e).slice(0,80))}
}
window.mkFav=mkFav;
/* listing details */
window.mkOpen=id=>{
  openPage("mkitem",{id});
  const x=(mk.list||[]).find(y=>y.id===id);
  if(x&&!mk.seen)mk.seen={};if(x&&!mk.seen[id]){mk.seen[id]=1;sb("/rest/v1/rpc/mk_view",{method:"POST",body:{lid:id}}).catch(()=>{})}
};
const mkFind=id=>(mk.list||[]).find(y=>y.id===id);
PAGES.mkitem={title:()=>"تفاصيل الإعلان",render:p=>{
  const x=mkFind(p.id);if(!x){if(mk.list===null&&!mk.busy)mkLoad();return mk.list===null?'<p class="muted">جارِ التحميل…</p>':'<div class="card empty"><b>الإعلان غير موجود أو اتحذف</b></div>'}
  const me=(cs()||{}).uid===x.user_id,s=cl.pp[x.user_id]||{id:x.user_id,name:"مستخدم"},im=mkImgs(x),c=mkCat(mkCatOf(x)),sub=mkSubOf(x),sold=x.status==="sold";
  const cond=(MKCOND.find(o=>o[0]===x.condition)||[])[1];
  const wa=x.phone&&x.whatsapp?'<a href="https://wa.me/'+esc(String(x.phone).replace(/\D/g,""))+'" rel="noopener">واتساب</a>':"";
  const sim=(mk.list||[]).filter(y=>y.id!==x.id&&mkCatOf(y)===mkCatOf(x)&&y.status!=="sold").sort((a,b)=>((mkSubOf(b)===sub)-(mkSubOf(a)===sub))).slice(0,6);
  const more=(mk.list||[]).filter(y=>y.user_id===x.user_id&&y.id!==x.id&&y.status!=="sold").length;
  return '<div class="mkgal">'+(im.length?im.map(u=>'<img loading="lazy" alt="" src="'+esc(u)+'">').join(""):'<div class="ph">'+c[1]+'</div>')+'</div>'+(im.length>1?'<small class="muted">اسحب لمشاهدة '+an(im.length)+' صور</small>':"")+
   (sold?'<div class="pill closed" style="margin:6px 0">تم البيع</div>':"")+
   '<div class="mkprice">'+esc(mkPrice(x))+(x.negotiable?' <small class="muted">· قابل للتفاوض</small>':"")+'</div><h3 style="margin:4px 0">'+esc(x.title)+'</h3>'+
   '<div class="mkmeta"><div><small>القسم</small>'+c[1]+' '+esc(c[2])+(sub?" › "+esc(sub):"")+'</div><div><small>الحالة</small>'+esc(cond||"غير محددة")+'</div><div><small>المدينة</small>'+esc(x.city||"—")+'</div><div><small>نُشر</small>'+agoAr(x.created_at)+' · 👁 '+an(x.views||0)+'</div></div>'+
   (x.tab==="transport"&&(x.from_place||x.to_place)?'<div class="card">🚌 '+esc(x.from_place||"؟")+' ⟵ '+esc(x.to_place||"؟")+'</div>':"")+
   (x.details?'<h4 style="margin:10px 0 4px">الوصف</h4><p class="fb" style="white-space:pre-wrap">'+esc(x.details)+'</p>':"")+
   '<div class="mkslr" onclick="openPage(\'user\',{id:\''+x.user_id+'\'})">'+avHtml(s,46)+'<span class="pb"><b>'+esc(s.name||"البائع")+(typeof vfMark==="function"?vfMark(s):"")+'</b><small class="muted">'+esc(s.city||x.city||"")+(more?" · "+an(more)+" إعلان آخر":"")+'</small></span><span>›</span></div>'+
   (me?'<div class="mkcta"><button onclick="mkSoldToggle(\''+x.id+'\')">'+(sold?"إعادة التفعيل":"✅ تم البيع")+'</button><button class="alt" onclick="mkEdit(\''+x.id+'\')">✏️ تعديل</button><button class="alt" onclick="mkDel(\''+x.id+'\')">🗑 حذف</button></div>':
    '<div class="mkcta">'+'<button onclick="startDm(\''+x.user_id+'\')">💬 رسالة</button>'+(x.phone?'<a class="alt" href="tel:'+esc(x.phone)+'">📞 اتصال</a>':"")+wa+'</div>')+
   '<div class="mkcta"><button class="alt" onclick="mkFav(\''+x.id+'\')">'+(mk.favs[x.id]?"❤️ في المفضلة":"🤍 حفظ")+'</button><button class="alt" onclick="mkShare(\''+x.id+'\')">↗️ مشاركة</button>'+(me?"":'<button class="alt" onclick="reportItem(\'market\',\''+x.id+'\')">🚩 إبلاغ</button>')+(!me&&cl.admin?'<button class="alt" onclick="mkDel(\''+x.id+'\')">🗑 حذف (إشراف)</button>':"")+'</div>'+
   (sim.length?'<h4 style="margin:14px 2px 8px">إعلانات مشابهة</h4><div class="mkg">'+sim.map(mkCard).join("")+'</div>':"");
}};
window.mkShare=id=>{const x=mkFind(id),t=x?x.title:"إعلان";try{navigator.share?navigator.share({title:t,text:t+" - "+mkPrice(x||{}),url:location.origin+location.pathname}):(copyText(t+" - "+location.origin+location.pathname),msg("اتنسخ ✅"))}catch(e){}};
window.mkSoldToggle=async id=>{const x=mkFind(id);if(!x)return;const st=x.status==="sold"?"active":"sold";try{await sb("/rest/v1/market_listings?id=eq."+id,{method:"PATCH",prefer:"return=minimal",body:{status:st}});x.status=st;msg(st==="sold"?"تم تعليم الإعلان: تم البيع":"تم إعادة التفعيل");mkRefresh()}catch(e){msg(sbErr(e).slice(0,80))}};
window.mkDel=async id=>{if(!confirm("حذف الإعلان؟"))return;try{await sb("/rest/v1/market_listings?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});mk.list=(mk.list||[]).filter(y=>y.id!==id);msg("تم الحذف");if(curPage()==="mkitem")backBtn();else mkRefresh()}catch(e){msg(sbErr(e).slice(0,80))}};
/* my listings */
PAGES.mkmine={title:()=>"إعلاناتي",act:()=>'<button class="pact" onclick="mkSell()">＋ إعلان</button>',render:()=>{
  if(!cs())return authCard();if(mk.list===null&&!mk.busy){mkLoad();return'<p class="muted">جارِ التحميل…</p>'}
  const u=cs().uid,L=(mk.list||[]).filter(x=>x.user_id===u),fv=(mk.list||[]).filter(x=>mk.favs[x.id]);
  const row=x=>'<div class="mkslr" onclick="mkOpen(\''+x.id+'\')"><div class="mki" style="width:60px;height:60px;aspect-ratio:auto;border-radius:10px;font-size:24px;'+(mkImgs(x)[0]?"background-image:url('"+esc(mkImgs(x)[0])+"')":"")+'">'+(mkImgs(x)[0]?"":mkCat(mkCatOf(x))[1])+'</div><span class="pb"><b>'+esc(x.title)+'</b><small class="muted">'+esc(mkPrice(x))+' · 👁 '+an(x.views||0)+(x.status==="sold"?" · تم البيع":"")+'</small></span></div>';
  return '<h4 style="margin:4px 2px">إعلاناتي ('+an(L.length)+')</h4>'+(L.length?L.map(row).join(""):'<div class="card empty"><b>لسه ما نشرتش إعلانات</b><button class="primary" onclick="mkSell()">＋ أضف إعلان</button></div>')+
   '<h4 style="margin:14px 2px 4px">❤️ المفضلة ('+an(fv.length)+')</h4>'+(fv.length?fv.map(row).join(""):'<p class="muted">اضغط 🤍 على أي إعلان لحفظه هنا.</p>');
}};
/* sell flow + edit */
function mkOptsCat(sel){return MKC.map(c=>'<option value="'+c[0]+'"'+(sel===c[0]?" selected":"")+'>'+c[1]+' '+c[2]+'</option>').join("")}
function mkOptsSub(cat,sel){const s=mkCat(cat)[3];return'<option value="">—</option>'+s.map(v=>'<option'+(sel===v?" selected":"")+'>'+esc(v)+'</option>').join("")}
window.mkSubFill=()=>{const e=el("sSub");if(e)e.innerHTML=mkOptsSub(val("sCat"),"")};
window.mkPrev=()=>{const b=el("sPrev"),f=[...((el("sImgs")||{}).files||[])].slice(0,8);if(b)b.innerHTML=f.map(x=>'<img alt="" src="'+URL.createObjectURL(x)+'">').join("")};
window.mkSell=function(x){
  if(!cs())return authModal("signup");if(banStop())return;
  const e=x&&x.id?x:null,cat=e?mkCatOf(e):(mk.cat||"vehicles");
  const opt=(a,v)=>a.map(o=>'<option value="'+o[0]+'"'+(v===o[0]?" selected":"")+'>'+o[1]+'</option>').join("");
  formModal(e?"✏️ تعديل الإعلان":"＋ إعلان جديد",
   '<label class="lbl">القسم</label><select id="sCat" class="input" onchange="mkSubFill()">'+mkOptsCat(cat)+'</select><label class="lbl">النوع</label><select id="sSub" class="input">'+mkOptsSub(cat,e?mkSubOf(e):mk.sub)+'</select>'+
   inp("sTitle","عنوان الإعلان",e?e.title:"",{max:80})+
   '<div class="mkrow"><div>'+inp("sPrice","السعر ("+mkCur()+")",e&&e.price_num!=null?String(e.price_num):"",{type:"text",mode:"numeric",max:12})+'</div><div><label class="lbl">الحالة</label><select id="sCond" class="input"><option value="">غير محددة</option>'+opt(MKCOND,e&&e.condition)+'</select></div></div>'+
   '<label class="row" style="gap:8px;margin:4px 0"><input type="checkbox" id="sNeg"'+(e&&e.negotiable?" checked":"")+'> قابل للتفاوض</label>'+
   inp("sDet","الوصف (الحالة، المواصفات، سبب البيع…)",e?e.details||"":"",{area:1,max:1000,rows:4})+
   inp("sCity","المدينة",e?e.city||"":(d.city||""),{max:40})+inp("sPhone","رقم الموبايل",e?e.phone||"":"",{type:"tel",mode:"tel",max:16})+
   '<label class="row" style="gap:8px;margin:4px 0"><input type="checkbox" id="sWa"'+(!e||e.whatsapp?" checked":"")+'> رقمي عليه واتساب</label>'+
   (e?'':'<label class="lbl">الصور (حتى ٨)</label><input id="sImgs" type="file" accept="image/*" multiple class="input" onchange="mkPrev()"><div id="sPrev" class="mkimgs"></div>')+'<p id="sErr" class="muted" style="color:#b0352d"></p>',
   ()=>(mkSave(e),!1),{save:e?"حفظ":"نشر الإعلان"});
};
window.mkEdit=id=>{const x=mkFind(id);if(x)mkSell(x)};
async function mkSave(e){
  const v=i=>(el(i)?el(i).value:"").trim(),title=v("sTitle"),phone=v("sPhone").replace(/[^\d+]/g,""),pn=mkNum(v("sPrice"));
  if(title.length<2)return msg("اكتب عنوان للإعلان");
  if(!window.YOMAK_PI&&!/^[0-9+]{7,16}$/.test(phone))return msg("اكتب رقم موبايل صحيح");
  const body={category:v("sCat"),subcategory:v("sSub")||null,title:title.slice(0,80),details:v("sDet").slice(0,1000)||null,price_num:pn===""?null:Number(pn),price:null,condition:v("sCond")||null,negotiable:!!el("sNeg").checked,city:v("sCity").slice(0,40),phone:phone||null,whatsapp:!!el("sWa").checked,updated_at:new Date().toISOString()};
  if(window.mkExtra){const ex=window.mkExtra();if(ex&&ex.error)return msg(ex.error);Object.assign(body,ex||{})}
  try{
    await ensureProfile();
    if(e){await sb("/rest/v1/market_listings?id=eq."+e.id,{method:"PATCH",prefer:"return=minimal",body});Object.assign(e,body)}
    else{
      const imgs=[];for(const f of [...((el("sImgs")||{}).files||[])].slice(0,8)){if(/^image\//.test(f.type)){const u=await upImg(await gImgData(f));if(u&&u.startsWith("https://"))imgs.push(u)}}
      await sb("/rest/v1/market_listings",{method:"POST",prefer:"return=minimal",body:{...body,tab:"general",country:d.country==="SA"?"SA":"EG",images:imgs.length?imgs:null}});
      mk.list=null;
    }
    closeModal();msg(e?"تم حفظ التعديل":"تم نشر الإعلان ✅");if(current==="market")render();else mkRefresh();
  }catch(er){const x=el("sErr");if(x)x.textContent="⚠️ "+sbErr(er);msg(sbErr(er).slice(0,80))}
}
/* keep the old report/find hooks working for the new listing objects */
(function(){const f=window.findItem;window.findItem=function(k,id){if(k==="market"){const x=mkFind(id+"");if(x)return{author:x.user_id,snap:x.title+(x.details?" - "+x.details:""),ref:x.id}}return f.apply(this,arguments)}})();
window.mx_unused=0;
(function(){const o=window.openPage;window.openPage=function(e){if(e==="mkt"||e==="market"){go("market");return}return o.apply(this,arguments)}})();
