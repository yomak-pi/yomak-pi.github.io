/* Ad maker v3: photo layouts, black-and-white, and "tell the app what to change" in plain Arabic (rule-based, free, no AI service). */
(function(){
const H=window.__adh;if(!H)return;const {tx,rr,TPL,priceLabel}=H;
const base=window.drawAd;
const LAY=[["classic","كلاسيك"],["full","صورة كاملة"],["minimal","بسيط"]];
function bwCanvas(cv){const c=cv.getContext("2d"),im=c.getImageData(0,0,cv.width,cv.height),d=im.data;for(let i=0;i<d.length;i+=4){const g=.3*d[i]+.59*d[i+1]+.11*d[i+2];d[i]=d[i+1]=d[i+2]=g}c.putImageData(im,0,0)}
function cover(c,img,x,y,w,h){const r=Math.max(w/img.width,h/img.height),sw=w/r,sh=h/r;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h);c.restore()}
function photoLayer(w,h){if(!ag.photo)return null;const cv=document.createElement("canvas");cv.width=w;cv.height=h;cover(cv.getContext("2d"),ag.photo,0,0,w,h);if(ag.bw)bwCanvas(cv);return cv}
const feats=e=>((e.feat||"")+"").split(/\s*[-–—،,+\n]\s*/).map(x=>x.trim()).filter(Boolean);
function parts(e){const p=((e.place||"")+"").split(/\s+[-–—]\s+|،/).map(x=>x.trim()).filter(Boolean);return{city:p[0]||e.place||"",rest:p.slice(1).join(" - ")}}
function header(c,T,e,W,alpha){
  c.save();c.globalAlpha=alpha;c.fillStyle=T.top;c.fillRect(0,0,W,300);c.restore();c.fillStyle=T.acc;c.fillRect(0,300,W,10);
  const P=parts(e);
  tx(c,"السلام عليكم ورحمة الله وبركاته",W/2,40,32,T.acc,900,1,false);
  tx(c,e.deal==="rent"?"للإيجار":"للبيع",W/2,135,120,"#fff",900,1);
  tx(c,"في "+P.city,W/2,242,56,T.acc,940,1);
  const o=(e.office||"").trim();c.beginPath();c.arc(120,72,46,0,7);c.fillStyle=T.acc;c.fill();tx(c,o.charAt(0)||"ي",120,72,56,T.top,70,1)}
function footer(c,T,e,W){c.fillStyle=T.foot;c.fillRect(0,1250,W,100);const k=T.id==="gold"||T.id==="dark"?"#000":"#fff";tx(c,(e.office||"").trim()||"عبر تطبيق يومك YOMAK",W/2,1285,44,k,980,1);tx(c,"📍 "+(e.place||""),W/2,1326,28,k,980,1,false)}
function drawPhotoClassic(e,T){
  const W=1080,Hh=1350,cv=document.createElement("canvas");cv.width=W;cv.height=Hh;const c=cv.getContext("2d");c.direction="rtl";c.textBaseline="middle";
  c.fillStyle=T.bg;c.fillRect(0,0,W,Hh);header(c,T,e,W,1);
  c.drawImage(photoLayer(W,290),0,310);
  const P=parts(e);let y=560;
  rr(c,50,y,980,130,30,T.hi);c.lineWidth=6;c.strokeStyle=T.acc;c.stroke();tx(c,e.type||"عقار",W/2,y+65,92,T.hiInk,900,1);y+=150;
  if(P.rest||e.place){rr(c,50,y,980,80,22,T.card);tx(c,"📍 "+(P.rest||e.place),W/2,y+40,38,T.ink,900,1);y+=96}
  if(e.dims){rr(c,50,y,980,90,22,T.card);tx(c,"📐 "+e.dims,W/2,y+45,34,T.ink,920,2);y+=104}
  const f=feats(e).slice(0,Math.max(0,Math.floor((1035-y)/62)));f.forEach((q,i)=>{rr(c,90,y+i*62,900,56,16,T.card);tx(c,"✔ "+q,W/2,y+i*62+28,36,T.ink,860,1)});
  rr(c,70,1050,940,110,55,T.hi);c.lineWidth=7;c.strokeStyle=T.acc;c.stroke();tx(c,"💰 "+priceLabel(e),W/2,1105,56,T.hiInk,860,1);
  tx(c,"📞 "+(e.phone||""),W/2,1205,66,T.ink,960,1);footer(c,T,e,W);return cv}
function drawFull(e,T){
  const W=1080,Hh=1350,cv=document.createElement("canvas");cv.width=W;cv.height=Hh;const c=cv.getContext("2d");c.direction="rtl";c.textBaseline="middle";
  const ph=photoLayer(W,Hh);if(ph)c.drawImage(ph,0,0);else{c.fillStyle=T.top;c.fillRect(0,0,W,Hh)}
  const g=c.createLinearGradient(0,0,0,Hh);g.addColorStop(0,"rgba(0,0,0,.72)");g.addColorStop(.35,"rgba(0,0,0,.12)");g.addColorStop(.55,"rgba(0,0,0,.35)");g.addColorStop(1,"rgba(0,0,0,.9)");c.fillStyle=g;c.fillRect(0,0,W,Hh);
  const P=parts(e);
  tx(c,"السلام عليكم ورحمة الله وبركاته",W/2,50,34,T.acc,900,1,false);
  tx(c,e.deal==="rent"?"للإيجار":"للبيع",W/2,160,140,"#fff",900,1);
  tx(c,"في "+P.city,W/2,270,60,T.acc,940,1);
  let y=640;rr(c,70,y,940,130,34,T.hi);tx(c,e.type||"عقار",W/2,y+65,92,T.hiInk,900,1);y+=160;
  if(P.rest||e.place){tx(c,"📍 "+(P.rest||e.place),W/2,y+30,42,"#fff",940,2);y+=84}
  if(e.dims){tx(c,"📐 "+e.dims,W/2,y+30,38,"#fff",940,2);y+=84}
  feats(e).slice(0,3).forEach((q,i)=>tx(c,"✔ "+q,W/2,y+26+i*54,38,"#fff",900,1));
  rr(c,70,1075,940,100,50,T.hi);c.lineWidth=6;c.strokeStyle=T.acc;c.stroke();tx(c,"💰 "+priceLabel(e),W/2,1125,54,T.hiInk,860,1);
  tx(c,"📞 "+(e.phone||""),W/2,1212,62,"#fff",960,1);footer(c,T,e,W);return cv}
function drawMin(e,T){
  const W=1080,Hh=1350,cv=document.createElement("canvas");cv.width=W;cv.height=Hh;const c=cv.getContext("2d");c.direction="rtl";c.textBaseline="middle";
  c.fillStyle=T.bg;c.fillRect(0,0,W,Hh);c.fillStyle=T.acc;c.fillRect(W-28,0,28,Hh);
  const P=parts(e);
  tx(c,"السلام عليكم ورحمة الله وبركاته",W/2-14,70,34,T.acc,880,1,false);
  tx(c,e.deal==="rent"?"للإيجار":"للبيع",W/2-14,220,190,T.hi===T.bg?T.ink:T.acc,880,1);
  c.fillStyle=T.ink;c.globalAlpha=.25;c.fillRect(120,330,800,3);c.globalAlpha=1;
  tx(c,e.type||"عقار",W/2-14,450,120,T.ink,880,1);
  tx(c,"في "+P.city,W/2-14,560,64,T.acc,880,1);
  let y=660;if(P.rest){tx(c,"📍 "+P.rest,W/2-14,y,42,T.ink,880,2);y+=90}
  if(e.dims){tx(c,"📐 "+e.dims,W/2-14,y,38,T.ink,880,2);y+=100}
  feats(e).slice(0,3).forEach((q,i)=>{tx(c,"✔ "+q,W/2-14,y+i*60,40,T.ink,860,1)});
  tx(c,priceLabel(e),W/2-14,1085,84,T.acc,900,1);
  tx(c,"📞 "+(e.phone||""),W/2-14,1180,70,T.ink,900,1);footer(c,T,e,W);return cv}
window.drawAd=function(e){
  const T=H.tpl(),L=ag.layout||"classic";
  if(L==="minimal")return drawMin(e,T);
  if(L==="full")return drawFull(e,T);
  if(ag.photo)return drawPhotoClassic(e,T);
  return base(e)};
/* UI: layout, photo, black-and-white, plain-words box */
const oR=PAGES.adgen.render;
PAGES.adgen.render=function(){
  let h=oR.apply(this,arguments);
  const ui='<label class="lbl">شكل التصميم</label><div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0">'+LAY.map(l=>'<button type="button" class="fchip adly" data-l="'+l[0]+'" onclick="agLay(\''+l[0]+'\')" style="'+((ag.layout||"classic")===l[0]?"outline:3px solid #f2a54a":"")+'">'+l[1]+'</button>').join("")+'</div>'
   +'<label class="lbl" for="agPhoto">📷 صورة العقار (اختياري)</label><input type="file" accept="image/*" id="agPhoto" class="input" onchange="agPhotoPick(this)"><div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0"><button type="button" class="fchip" onclick="agBw(false)">🎨 بالألوان</button><button type="button" class="fchip" onclick="agBw(true)">⚫⚪ أبيض وأسود</button><button type="button" class="fchip" onclick="agNoPhoto()">🚫 بدون صورة</button></div>'
   +'<div class="card" style="margin:10px 0;background:rgba(242,165,74,.12)"><b>✏️ قول للتطبيق يعدّل</b><p class="muted" style="margin:4px 0">اكتب بكلامك العادي، مثال: «خلي اللون ذهبي»، «السعر 70 ألف»، «بالأبيض والأسود»، «صورة كاملة»، «غير الرقم 0555…»</p><textarea id="agCmd" class="input" rows="2" maxlength="300" placeholder="اكتب التعديل هنا…"></textarea><button class="primary" type="button" style="margin-top:6px" onclick="agDo()">✨ عدّل الإعلان</button><div id="agCmdOut" class="muted" style="margin-top:6px"></div></div>';
  return h.replace('<label class="lbl">تصميم الإعلان</label>',ui+'<label class="lbl">تصميم الإعلان</label>');
};
window.agLay=id=>{ag.layout=id;document.querySelectorAll(".adly").forEach(b=>b.style.outline=b.dataset.l===id?"3px solid #f2a54a":"");if(ag.canvas)agGen()};
window.agBw=v=>{ag.bw=!!v;if(ag.canvas)agGen();else msg(v?"هتطلع الصورة أبيض وأسود":"هتطلع الصورة بالألوان")};
window.agNoPhoto=()=>{ag.photo=null;const f=el("agPhoto");if(f)f.value="";if(ag.canvas)agGen()};
window.agPhotoPick=inp=>{const f=inp.files&&inp.files[0];if(!f)return;if(f.size>15*1048576){inp.value="";return msg("الصورة كبيرة، اختار أصغر من 15 ميجا")}
  const im=new Image();im.onload=()=>{ag.photo=im;if(ag.canvas)agGen();else msg("اتضافت الصورة. اضغط اعمل الإعلان")};im.onerror=()=>msg("مقدرتش أقرأ الصورة");im.src=URL.createObjectURL(f)};
/* plain-words commands */
const N=s=>(s||"").replace(/[\u064B-\u0652\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)).toLowerCase();
const BWRE=/ابيض\s*و\s*(?:ال)?اسود|اسود\s*و\s*(?:ال)?ابيض|بلا الوان|رمادي/;
const THEME=[["gold",/ذهب|دهب|فخم|فاخر/],["blue",/ازرق|زرقا|عصري|كحلي/],["red",/احمر|حمرا|لافت/],["dark",/اسود|سودا|انيق|دارك|داكن/],["green",/اخضر|خضرا|يومك/]];
const FIELD={"السعر":"agPrice","السوم":"agPrice","الرقم":"agPhone","الجوال":"agPhone","رقم":"agPhone","الهاتف":"agPhone","المكتب":"agOffice","المكان":"agPlace","الموقع":"agPlace","العنوان":"agPlace","الابعاد":"agDims","المساحه":"agDims","المميزات":"agFeat","النوع":"agType"};
window.agDo=function(){
  const raw=(el("agCmd").value||"").trim();if(!raw)return msg("اكتب التعديل الأول");
  if(!ag.canvas&&!(val("agType")&&val("agPlace")))return msg("اعمل الإعلان الأول (نوع العقار والمكان)");
  const done=[];const n=N(raw);
  /* field edits first, from the original text so values keep their form */
  const keys=Object.keys(FIELD).sort((a,b)=>b.length-a.length);
  raw.split(/[\n،]|\sثم\s|\sوبعدين\s/).forEach(seg=>{
    const sn=N(seg);for(const k of keys){const m=sn.match(new RegExp("(?:^|\\s)"+k+"\\s*(?:الي|الى|ل|لـ|:|=|هو|يبقي|يكون)?\\s+(.+)$"))||sn.match(new RegExp("(?:^|\\s)"+k+"\\s*[:=]\\s*(.+)$"));
      if(m){const at=sn.lastIndexOf(m[1]);let v=seg.trim().slice(Math.max(0,at)).trim();if(v){if(FIELD[k]==="agPhone")v=v.replace(/[^\d+٠-٩]/g,"");const e=el(FIELD[k]);if(e){e.value=v;done.push(k+": "+v)}}break}}
  });
  if(/للايجار|ايجار/.test(n)&&!/للبيع/.test(n)){el("agDeal").value="rent";done.push("للإيجار")}else if(/للبيع|بيع/.test(n)&&el("agDeal")){el("agDeal").value="sale";done.push("للبيع")}
  /* style */
  const nb=n.replace(BWRE,"");const wantColor=/(?:لون|خلي|اجعل|غير|اعمل|قالب|تصميم|شكل)/.test(n)||THEME.some(t=>t[1].test(nb));
  if(wantColor){const t=THEME.find(t=>t[1].test(nb));if(t){ag.tpl=t[0];done.push("اللون: "+TPL.find(x=>x.id===t[0]).n)}}
  if(/(قالب|تصميم|شكل)\s*(تاني|اخر|مختلف|جديد)|غيره|غير القالب/.test(n)&&!done.some(d=>d.startsWith("اللون"))){const i=TPL.findIndex(x=>x.id===(ag.tpl||"green"));ag.tpl=TPL[(i+1)%TPL.length].id;done.push("قالب تاني")}
  if(BWRE.test(n)){ag.bw=true;done.push("صورة أبيض وأسود")}else if(/بالالوان|ملون|الوان الصوره/.test(n)){ag.bw=false;done.push("صورة بالألوان")}
  if(/بدون صوره|شيل الصوره|من غير صوره|امسح الصوره/.test(n)){ag.photo=null;done.push("من غير صورة")}
  else if(/(ضيف|اضف|حط|اختار|ارفع).{0,10}صوره/.test(n)&&el("agPhoto")){setTimeout(()=>el("agPhoto").click(),50);done.push("اختار الصورة")}
  if(/صوره كامله|خلفيه صوره|الصوره ورا|ملء الشاشه|كامل الصوره/.test(n)){ag.layout="full";done.push("صورة كاملة")}
  else if(/بسيط|مينيمال|ساده|نظيف/.test(n)){ag.layout="minimal";done.push("تصميم بسيط")}
  else if(/كلاسيك|عادي|الاصلي|زي الاول/.test(n)){ag.layout="classic";done.push("كلاسيك")}
  const out=el("agCmdOut");
  if(!done.length){if(out)out.textContent="مفهمتش 🙏 جرّب مثلًا: «خلي اللون أحمر»، «السعر 80 ألف»، «بالأبيض والأسود»، «صورة كاملة»، «بسيط»، «بدون صورة»";return}
  if(out)out.textContent="✅ تم: "+done.join(" • ");
  el("agCmd").value="";agGen();
};
})();
