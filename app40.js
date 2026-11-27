/* Phase 7: real estate inside the market: purpose (sale/rent), rooms, area, price, map search with OpenStreetMap (Leaflet, free). */
const RE_PURPOSE=[["","الكل"],["sale","للبيع"],["rent","للإيجار"]];
mk.re={purpose:"",beds:"",amin:"",amax:"",view:"list"};
const reCenters={"بريدة":[26.326,43.975],"عنيزة":[26.084,43.9937],"الرياض":[24.7136,46.6753],"جدة":[21.4858,39.1925],"مكة":[21.3891,39.8579],"المدينة":[24.5247,39.5692],"الدمام":[26.4207,50.0888],"الخبر":[26.2172,50.1971],"القاهرة":[30.0444,31.2357],"الإسكندرية":[31.2001,29.9187],"الجيزة":[30.0131,31.2089],"المنصورة":[31.0409,31.3785],"أسوان":[24.0889,32.8998]};
function reCenter(){const c=d.city||"";for(const k in reCenters)if(c.includes(k))return reCenters[k];return d.country==="SA"?[24.7136,46.6753]:[30.0444,31.2357]}
let reMap=null,reLayer=null,rePick=null,reLoading=null;
function reLeaflet(){
  if(window.L)return Promise.resolve();if(reLoading)return reLoading;
  return reLoading=new Promise((ok,no)=>{
    const l=document.createElement("link");l.rel="stylesheet";l.href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";document.head.append(l);
    const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>ok();s.onerror=()=>{reLoading=null;no(new Error("map"))};document.head.append(s);
  });
}
const reCss=document.createElement("style");
reCss.textContent=".rebar{background:#fff;border:1px solid var(--line,#e3e8e6);border-radius:14px;padding:8px;margin:0 0 10px}.rebar .r{display:flex;gap:6px;align-items:center;overflow-x:auto;margin-bottom:6px;scrollbar-width:none}.rebar .r::-webkit-scrollbar{display:none}.rebar .r:last-child{margin-bottom:0}.rebar .lb{font-size:12px;color:var(--muted,#667);white-space:nowrap}.rebar input{width:76px;min-height:36px;padding:0 8px;border:1px solid var(--line,#ddd);border-radius:10px;font:inherit}"+
".remap{height:calc(100dvh - 590px);min-height:280px;border-radius:14px;overflow:hidden;border:1px solid var(--line,#e3e8e6);position:relative;z-index:0}.remap .leaflet-container{height:100%;width:100%;font:inherit}"+
".rem{background:var(--g,#155b50);color:#fff;border-radius:14px;padding:3px 8px;font-weight:800;font-size:12px;white-space:nowrap;border:2px solid #fff;box-shadow:0 1px 5px #0006;transform:translate(-50%,-100%);position:absolute}.rem.sale{background:#2f5fa8}.rem.rent{background:#b0352d}.rem.sel{background:var(--gold,#e0a030);color:#222}"+
".remc{position:absolute;bottom:8px;left:8px;right:8px;z-index:500;background:#fff;border-radius:14px;box-shadow:0 2px 10px #0004;padding:8px;display:flex;gap:10px;align-items:center}.remc .mki{width:76px;height:76px;aspect-ratio:auto;border-radius:10px;flex:0 0 76px;font-size:30px}.remc .t{flex:1;min-width:0}.remc .t b{display:block;color:var(--g,#155b50)}.remc .t div{font-size:13px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}"+
".mkre{padding:2px 8px 0;font-size:12px;color:var(--muted,#667);display:flex;gap:6px;flex-wrap:wrap}.mkre b{background:#e8eeec;color:var(--g,#155b50);border-radius:8px;padding:0 6px}"+
".resp{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.resp div{background:#f3f6f5;border-radius:10px;padding:8px 4px;text-align:center;font-size:13px}.resp b{display:block;font-size:16px;color:var(--g,#155b50)}"+
".reloc{height:190px;border-radius:14px;overflow:hidden;margin:8px 0;border:1px solid var(--line,#e3e8e6);position:relative;z-index:0}";
document.head.append(reCss);
const isRE=x=>mkCatOf(x)==="realestate";
const reShort=x=>{const n=Number(x.price_num);if(x.price_num==null||isNaN(n))return"—";if(n>=1e6)return an((n/1e6).toFixed(n%1e6?1:0))+"م";if(n>=1e3)return an(Math.round(n/1e3))+"ألف";return an(n)};
const rePurpose=x=>x.purpose==="sale"?"للبيع":x.purpose==="rent"?"للإيجار":"";
/* filters */
const _mkFiltered=window.mkFiltered;
window.mkFiltered=function(){
  let L=_mkFiltered.apply(this,arguments);
  if(mk.cat==="realestate"){
    const r=mk.re;
    L=L.filter(x=>{
      if(r.purpose&&x.purpose!==r.purpose)return false;
      if(r.beds!==""){const b=x.bedrooms==null?-1:x.bedrooms;if(r.beds==="4"?b<4:b!==Number(r.beds))return false}
      if(r.amin!==""&&(x.area_m2==null||Number(x.area_m2)<Number(r.amin)))return false;
      if(r.amax!==""&&(x.area_m2==null||Number(x.area_m2)>Number(r.amax)))return false;
      return true;
    });
  }
  return L;
};
const _mkFilterCount=window.mkFilterCount;
window.mkFilterCount=function(){let n=_mkFilterCount();if(mk.cat==="realestate"){const r=mk.re;n+=(r.purpose?1:0)+(r.beds!==""?1:0)+(r.amin!==""?1:0)+(r.amax!==""?1:0)}return n};
/* card meta */
const _mkCard=window.mkCard;
window.mkCard=function(x){
  const h=_mkCard.apply(this,arguments);if(!isRE(x))return h;
  const meta=[rePurpose(x)?"<b>"+rePurpose(x)+"</b>":"",x.bedrooms!=null?an(x.bedrooms)+" غرف":"",x.area_m2!=null?an(Number(x.area_m2))+" م²":""].filter(Boolean).join(" ");
  return h.replace('<div class="mkt">','<div class="mkre">'+meta+'</div><div class="mkt">');
};
/* the real-estate bar + list/map switch */
const _mkTab=window.mkTab;
window.mkTab=function(){
  let h=_mkTab.apply(this,arguments);
  if(mk.cat!=="realestate")return h;
  const r=mk.re,chip=(a,v,k,l)=>'<button class="fchip'+(String(r[k])===v?" on":"")+'" onclick="reSet(\''+k+'\',\''+v+'\')">'+l+'</button>';
  const bar='<div class="rebar"><div class="r">'+RE_PURPOSE.map(p=>chip(0,p[0],"purpose",p[1])).join("")+'<span style="flex:1"></span><button class="fchip'+(r.view==="list"?" on":"")+'" onclick="reSet(\'view\',\'list\')">📋 قائمة</button><button class="fchip'+(r.view==="map"?" on":"")+'" onclick="reSet(\'view\',\'map\')">🗺️ خريطة</button></div>'+
   '<div class="r"><span class="lb">الغرف</span>'+[["","أي"],["1","١"],["2","٢"],["3","٣"],["4","٤+"]].map(b=>chip(0,b[0],"beds",b[1])).join("")+'</div>'+
   '<div class="r"><span class="lb">المساحة م²</span><input inputmode="numeric" placeholder="من" value="'+esc(r.amin)+'" onchange="reSet(\'amin\',mkNum(this.value))"><input inputmode="numeric" placeholder="إلى" value="'+esc(r.amax)+'" onchange="reSet(\'amax\',mkNum(this.value))"></div></div>';
  return h.replace('<div id="mkList">',bar+'<div id="mkList">');
};
window.reSet=(k,v)=>{mk.re[k]=v;render()};
const _mkClear=window.mkClear;
window.mkClear=function(){mk.re={purpose:"",beds:"",amin:"",amax:"",view:"list"};return _mkClear.apply(this,arguments)};
const _mkListHtml=window.mkListHtml;
window.mkListHtml=function(){
  if(mk.cat==="realestate"&&mk.re.view==="map"&&mk.list!==null)return reSearchBar("main")+'<div class="remap" id="reMap"><p class="muted" style="padding:14px">جارِ تحميل الخريطة…</p></div><p class="muted" id="reCnt" style="margin:6px 2px"></p>';
  return _mkListHtml.apply(this,arguments);
};
const _mkRedrawList=window.mkRedrawList;
window.mkRedrawList=function(){_mkRedrawList.apply(this,arguments);reMapInit()};
window.mkAfter=reMapInit;
async function reMapInit(){
  if(mk.cat!=="realestate"||mk.re.view!=="map"||!el("reMap"))return;
  try{await reLeaflet()}catch(e){el("reMap").innerHTML='<p class="muted" style="padding:14px">⚠️ تعذر تحميل الخريطة. تأكد من الاتصال.</p>';return}
  const box=el("reMap");if(!box)return;
  if(reMap){try{reMap.remove()}catch(e){}reMap=null}
  box.innerHTML="";const c=reCenter();
  reMap=L.map(box,{zoomControl:true,attributionControl:true}).setView(c,12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(reMap);
  const items=mkFiltered().filter(x=>x.lat!=null&&x.lng!=null&&x.status!=="sold");
  const pts=[];
  items.forEach(x=>{
    const ic=L.divIcon({className:"",html:'<div class="rem '+(x.purpose||"")+'">'+reShort(x)+'</div>',iconSize:[0,0]});
    const m=L.marker([x.lat,x.lng],{icon:ic}).addTo(reMap);pts.push([x.lat,x.lng]);
    m.on("click",()=>reShowCard(x));
  });
  const n=el("reCnt");if(n){const all=mkFiltered().length;n.textContent=items.length?an(items.length)+" إعلان على الخريطة"+(all>items.length?" · "+an(all-items.length)+" بدون موقع (شوفهم في القائمة)":""):"لا توجد إعلانات بموقع على الخريطة بعد."}
  if(pts.length>1)reMap.fitBounds(pts,{padding:[40,40],maxZoom:15});else if(pts.length===1)reMap.setView(pts[0],14);
  reMap.on("click",()=>{const o=document.querySelector(".remc");if(o)o.remove()});
  setTimeout(()=>reMap&&reMap.invalidateSize(),200);
}
function reShowCard(x){
  const box=el("reMap");if(!box)return;const o=box.querySelector(".remc");if(o)o.remove();
  const im=mkImgs(x)[0];
  box.insertAdjacentHTML("beforeend",'<div class="remc" onclick="mkOpen(\''+x.id+'\')"><div class="mki"'+(im?" style=\"background-image:url('"+esc(im)+"')\"":"")+'>'+(im?"":"🏠")+'</div><div class="t"><b>'+esc(mkPrice(x))+'</b><div>'+esc(x.title)+'</div><div class="muted">'+[rePurpose(x),x.bedrooms!=null?an(x.bedrooms)+" غرف":"",x.area_m2!=null?an(Number(x.area_m2))+" م²":"",x.district||x.city||""].filter(Boolean).join(" · ")+'</div></div><span>›</span></div>');
}
/* details: specs + location map */
const _it=PAGES.mkitem.render;
PAGES.mkitem.render=function(p){
  const h=_it.apply(this,arguments),x=mkFind(p.id);if(!x||!isRE(x))return h;
  const cells=[[x.bedrooms,"غرف نوم"],[x.bathrooms,"حمامات"],[x.area_m2!=null?Number(x.area_m2):null,"م²"]].filter(c=>c[0]!=null).map(c=>'<div><b>'+an(c[0])+'</b>'+c[1]+'</div>').join("");
  const ex=(rePurpose(x)?'<div class="pill" style="margin:6px 0">'+rePurpose(x)+(x.furnished===true?" · مفروشة":x.furnished===false?" · غير مفروشة":"")+'</div>':"")+(cells?'<div class="resp">'+cells+'</div>':"")+
   (x.area_m2&&x.price_num&&x.purpose==="sale"?'<small class="muted">سعر المتر: '+an(Math.round(x.price_num/x.area_m2).toLocaleString("en-US"))+' '+(x.country==="SA"?"ر.س":"ج.م")+'</small>':"")+
   (x.lat!=null?'<h4 style="margin:10px 2px 4px">📍 الموقع'+(x.district?" · "+esc(x.district):"")+'</h4><div class="reloc" id="reLoc"></div>':"");
  return h.replace('<div class="mkslr"',ex+'<div class="mkslr"');
};
PAGES.mkitem.after=async p=>{
  const x=mkFind(p&&p.id);if(!x||x.lat==null||!el("reLoc"))return;
  try{await reLeaflet()}catch(e){return}
  const b=el("reLoc");if(!b||b._lf)return;b._lf=1;
  const m=L.map(b,{zoomControl:false,dragging:false,scrollWheelZoom:false,attributionControl:false}).setView([x.lat,x.lng],15);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(m);L.marker([x.lat,x.lng]).addTo(m);
  b.addEventListener("click",()=>window.open("https://www.openstreetmap.org/?mlat="+x.lat+"&mlon="+x.lng+"#map=17/"+x.lat+"/"+x.lng,"_blank","noopener"));
};
/* sell form: real-estate fields + map pin */
const _mkSell=window.mkSell;
window.mkSell=function(x){
  _mkSell.apply(this,arguments);
  const e=x&&x.id?x:null,sub=el("sSub");if(!sub)return;
  rePick=e&&e.lat!=null?[e.lat,e.lng]:null;
  const blk=document.createElement("div");blk.id="sRe";blk.style.display="none";
  blk.innerHTML='<div class="mkrow"><div><label class="lbl">الغرض</label><select id="sPur" class="input"><option value="sale"'+(e&&e.purpose==="sale"?" selected":"")+'>للبيع</option><option value="rent"'+(e&&e.purpose==="rent"?" selected":"")+'>للإيجار</option></select></div><div><label class="lbl">المساحة (م²)</label><input id="sArea" class="input" inputmode="numeric" value="'+esc(e&&e.area_m2!=null?String(Number(e.area_m2)):"")+'"></div></div>'+
   '<div class="mkrow"><div><label class="lbl">غرف النوم</label><input id="sBeds" class="input" inputmode="numeric" value="'+esc(e&&e.bedrooms!=null?String(e.bedrooms):"")+'"></div><div><label class="lbl">الحمامات</label><input id="sBath" class="input" inputmode="numeric" value="'+esc(e&&e.bathrooms!=null?String(e.bathrooms):"")+'"></div></div>'+
   '<label class="row" style="gap:8px;margin:4px 0"><input type="checkbox" id="sFurn"'+(e&&e.furnished?" checked":"")+'> مفروشة</label><label class="lbl">الحي / المنطقة</label><input id="sDist" class="input" maxlength="60" value="'+esc(e&&e.district||"")+'">'+
   '<label class="lbl">📍 حدد الموقع على الخريطة (اضغط على مكان العقار)</label>'+reSearchBar("form")+'<div class="reloc" id="sMap" style="height:220px"></div><button type="button" class="chip" onclick="reMyLoc()">📍 موقعي الحالي</button><small class="muted" id="sMapT">'+(rePick?"تم تحديد الموقع":"لسه ما حددتش الموقع")+'</small>';
  sub.parentNode.insertBefore(blk,sub.nextSibling);reToggleForm();
};
const _mkSubFill=window.mkSubFill;
window.mkSubFill=function(){_mkSubFill.apply(this,arguments);reToggleForm()};
async function reToggleForm(){
  const b=el("sRe"),c=el("sCat");if(!b||!c)return;const on=c.value==="realestate";b.style.display=on?"block":"none";
  if(!on)return;try{await reLeaflet()}catch(e){const t=el("sMapT");if(t)t.textContent="تعذر تحميل الخريطة";return}
  const m=el("sMap");if(!m||m._lf)return;m._lf=1;
  const ctr=rePick||reCenter(),mp=L.map(m,{attributionControl:false}).setView(ctr,rePick?15:12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(mp);
  let mr=rePick?L.marker(rePick).addTo(mp):null;window._reForm={mp,set:ll=>{rePick=[ll.lat,ll.lng];if(mr)mr.setLatLng(ll);else mr=L.marker(ll).addTo(mp);el("sMapT").textContent="تم تحديد الموقع ✅"}};
  mp.on("click",e=>window._reForm.set(e.latlng));setTimeout(()=>mp.invalidateSize(),250);
}
window.reMyLoc=()=>{
  if(!navigator.geolocation)return msg("الجهاز لا يدعم تحديد الموقع");
  navigator.geolocation.getCurrentPosition(p=>{const ll={lat:p.coords.latitude,lng:p.coords.longitude};if(window._reForm){window._reForm.set(ll);window._reForm.mp.setView([ll.lat,ll.lng],16)}},()=>msg("ما قدرناش نحدد موقعك. اضغط على الخريطة بإيدك."),{enableHighAccuracy:true,timeout:10000});
};
window.mkExtra=function(){
  const c=el("sCat");if(!c||c.value!=="realestate")return{purpose:null,area_m2:null,bedrooms:null,bathrooms:null,furnished:null,district:null,lat:null,lng:null};
  const n=i=>{const v=mkNum((el(i)||{}).value||"");return v===""?null:Number(v)};
  const a=n("sArea");if(a===null||a<=0)return{error:"اكتب مساحة العقار بالمتر"};
  return{purpose:val("sPur")||"sale",area_m2:a,bedrooms:n("sBeds"),bathrooms:n("sBath"),furnished:!!el("sFurn").checked,district:val("sDist").slice(0,60)||null,lat:rePick?rePick[0]:null,lng:rePick?rePick[1]:null};
};

function reSearchBar(w){return'<div class="row" style="margin:6px 0"><input id="reQ_'+w+'" class="input" placeholder="ابحث عن حي أو عنوان" onkeydown="if(event.key===\'Enter\'){event.preventDefault();reSearchAddr(\''+w+'\')}"><button type="button" class="chip" style="white-space:nowrap" onclick="reSearchAddr(\''+w+'\')">🔎 بحث</button></div>'}
window.reSearchAddr=async w=>{
  const q=val("reQ_"+w);if(q.length<2)return msg("اكتب اسم الحي أو العنوان");
  const t=el("reQ_"+w),cc=(typeof d!=="undefined"&&d.country==="EG")?"eg":"sa";
  try{
    const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ar&countrycodes="+cc+"&q="+encodeURIComponent(q+(d.city?" "+d.city:"")));
    const j=await r.json();if(!j||!j[0]){const r2=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ar&countrycodes="+cc+"&q="+encodeURIComponent(q));const j2=await r2.json();if(!j2||!j2[0])return msg("ما لقيتش المكان ده. جرب اسم تاني.");j[0]=j2[0]}
    const ll=[Number(j[0].lat),Number(j[0].lon)];
    if(w==="main"){if(reMap)reMap.setView(ll,14)}
    else if(window._reForm){window._reForm.mp.setView(ll,15);window._reForm.set({lat:ll[0],lng:ll[1]})}
  }catch(e){msg("البحث عن العنوان مش شغال دلوقتي. جرب بعد شوية أو حدد على الخريطة.")}
};
