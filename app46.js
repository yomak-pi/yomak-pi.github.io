/* Ad templates (5 designs) + sharing + reposts. */
(function(){
const TPL=[
 {id:"green",n:"أخضر يومك",bg:"#f5f7f4",top:"#155b50",acc:"#f2a54a",ink:"#123c3a",card:"#fff",hi:"#155b50",hiInk:"#fff",foot:"#111"},
 {id:"gold",n:"ذهبي فخم",bg:"#14110b",top:"#1d1810",acc:"#d4a437",ink:"#f4e6bf",card:"#241d11",hi:"#d4a437",hiInk:"#1b1405",foot:"#d4a437"},
 {id:"blue",n:"أزرق عصري",bg:"#eef3fb",top:"#123a7a",acc:"#ffb703",ink:"#0b2a5a",card:"#fff",hi:"#123a7a",hiInk:"#fff",foot:"#0b2a5a"},
 {id:"red",n:"أحمر لافت",bg:"#fff6f3",top:"#b3261e",acc:"#ffd166",ink:"#3a1210",card:"#fff",hi:"#b3261e",hiInk:"#fff",foot:"#3a1210"},
 {id:"dark",n:"أسود أنيق",bg:"#101418",top:"#000",acc:"#3ddc97",ink:"#e8f0ee",card:"#1a2026",hi:"#3ddc97",hiInk:"#06251a",foot:"#3ddc97"}
];
window.AD_TPLS=TPL;
function tpl(){return TPL.find(t=>t.id===ag.tpl)||TPL[0]}
function rr(c,x,y,w,h,r,f){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();if(f){c.fillStyle=f;c.fill()}}
function wrap(c,t,w){const out=[];let l="";(t+"").split(/\s+/).forEach(s=>{const n=l?l+" "+s:s;if(c.measureText(n).width>w&&l){out.push(l);l=s}else l=n});if(l)out.push(l);return out}
function tx(c,t,x,y,size,col,w,max,bold){t=(t||"")+"";if(!t)return 0;let s=size,L;for(;s>=22;s-=3){c.font=(bold===false?"":"bold ")+s+"px system-ui,Tahoma,Arial";L=wrap(c,t,w);if(L.length<=max&&L.every(q=>c.measureText(q).width<=w))break}
 L=L.slice(0,max);const lh=s*1.32,y0=y-(L.length-1)*lh/2;c.fillStyle=col;c.textAlign="center";L.forEach((q,i)=>c.fillText(q,x,y0+i*lh));return L.length*lh}
const priceLabel=e=>{let p=(e.price||"").trim();if(!p)return"السعر عند التواصل";p=p.replace(/^(السوم|السعر|بسعر|سوم)\s*[:：]?\s*/,"");return /^سومها/.test(p)?p:"سومها "+p};
window.drawAd=function(e){
  const T=tpl(),W=1080,H=1350,cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");c.direction="rtl";c.textBaseline="middle";
  const sale=e.deal!=="rent";
  const parts=((e.place||"")+"").split(/\s+[-–—]\s+|،/).map(x=>x.trim()).filter(Boolean),city=parts[0]||e.place||"",rest=parts.slice(1).join(" - ");
  c.fillStyle=T.bg;c.fillRect(0,0,W,H);
  /* pattern */
  c.globalAlpha=.07;c.strokeStyle=T.acc;c.lineWidth=2;for(let i=-H;i<W+H;i+=60){c.beginPath();c.moveTo(i,0);c.lineTo(i-H,H);c.stroke()}c.globalAlpha=1;
  /* header */
  c.fillStyle=T.top;c.fillRect(0,0,W,300);c.fillStyle=T.acc;c.fillRect(0,300,W,10);
  const office=(e.office||"").trim();
  tx(c,"السلام عليكم ورحمة الله وبركاته",W/2,40,32,T.acc,900,1,false);
  tx(c,sale?"للبيع":"للإيجار",W/2,135,120,"#fff",900,1);
  tx(c,"في "+city,W/2,242,56,T.acc,940,1);
  /* logo circle */
  c.beginPath();c.arc(120,72,46,0,7);c.fillStyle=T.acc;c.fill();tx(c,(office||"يومك").trim().charAt(0)||"ي",120,72,56,T.top,70,1);
  let y=340;
  if(rest||e.place){rr(c,50,y,980,100,26,T.card);c.strokeStyle=T.acc;c.lineWidth=4;c.stroke();tx(c,"📍 "+(rest||e.place),W/2,y+50,42,T.ink,900,2);y+=120}
  rr(c,50,y,980,140,30,T.hi);tx(c,e.type||"عقار",W/2,y+70,100,T.hiInk,900,1);y+=165;
  if(e.dims){rr(c,50,y,980,110,24,T.card);c.strokeStyle=T.acc;c.lineWidth=3;c.stroke();tx(c,"📐 "+e.dims,W/2,y+55,38,T.ink,920,2);y+=130}
  const feats=((e.feat||"")+"").split(/\s*[-–—،,+\n]\s*/).map(x=>x.trim()).filter(Boolean).slice(0,4);
  const room=Math.max(0,1020-y),fh=Math.min(72,room/Math.max(1,feats.length));
  feats.forEach((f,i)=>{const yy=y+fh*i+fh/2;rr(c,90,yy-fh/2+4,900,fh-8,18,T.card);tx(c,"✔ "+f,W/2,yy,40,T.ink,860,1)});
  /* price */
  rr(c,70,1030,940,120,60,T.hi);c.lineWidth=7;c.strokeStyle=T.acc;c.stroke();tx(c,"💰 "+priceLabel(e),W/2,1090,60,T.hiInk,860,1);
  tx(c,"📞 "+(e.phone||""),W/2,1190,74,T.ink,960,1);
  /* footer */
  c.fillStyle=T.foot;c.fillRect(0,1250,W,100);
  tx(c,office||"عبر تطبيق يومك YOMAK",W/2,1285,44,T.id==="gold"||T.id==="dark"?"#000":"#fff",980,1);
  tx(c,"📍 "+(e.place||""),W/2,1326,28,T.id==="gold"||T.id==="dark"?"#000":"#fff",980,1,false);
  return cv};
window.__adh={tx,rr,TPL,priceLabel,tpl};
const oFields=window.agFields;
window.agFields=function(){const f=oFields();f.office=(el("agOffice")?el("agOffice").value.trim():"")||(es&&es.office&&es.office.name)||"";return f};
const oRender=PAGES.adgen.render;
PAGES.adgen.render=function(){
  let h=oRender.apply(this,arguments);
  const picker='<label class="lbl">تصميم الإعلان</label><div class="adtpls" style="display:flex;gap:8px;overflow-x:auto;padding:4px 0 8px">'+TPL.map(t=>'<button type="button" class="adtp" data-t="'+t.id+'" onclick="agPick(\''+t.id+'\')" style="flex:0 0 auto;min-width:92px;padding:10px 8px;border-radius:12px;border:3px solid '+(t.id===(ag.tpl||"green")?"#f2a54a":"transparent")+';background:'+t.top+';color:'+t.acc+';font-weight:bold">'+t.n+'</button>').join("")+'</div>'+inp("agOffice","اسم المكتب (يظهر أسفل الإعلان)",(es&&es.office&&es.office.name)||"",{max:60});
  return h.replace('<button class="primary" style="margin-top:10px" onclick="agGen()">',picker+'<button class="primary" style="margin-top:10px" onclick="agGen()">');
};
window.agPick=id=>{ag.tpl=id;document.querySelectorAll(".adtp").forEach(b=>b.style.borderColor=b.dataset.t===id?"#f2a54a":"transparent");if(ag.canvas)agGen()};
/* Sharing row: in-app post, any app (with image), WhatsApp */
const og=window.agGen;
window.agGen=function(){
  const r=og.apply(this,arguments);
  const row=document.querySelector("#agOut .fact");
  if(row)row.innerHTML='<button class="fb-wa" onclick="agPublish()">📣 انشر في يومك</button><button class="fb-call" onclick="agShare()">📤 مشاركة في أي تطبيق</button><button class="fb-wa" style="background:#1fa855" onclick="agShareWa()">🟢 واتساب</button><button class="fb-chat" onclick="agSave()">💾 حفظ الصورة</button>';
  return r};
window.agShareWa=async function(){
  if(!ag.canvas)return;const t=el("agWa")?el("agWa").value:"";
  try{const b=await agBlob(),f=new File([b],"yomak-ad.png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:t});return}}catch(e){if(e&&e.name==="AbortError")return}
  agSave();setTimeout(()=>{if(!window.YOMAK_PI)window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank","noopener")},500);msg("اتحفظت الصورة، ضيفها في الواتساب")};
/* Reposts */
const SVC_OK=/^[0-9a-f-]{36}$/i;
window.svcRepost=async function(id){
  if(!cs())return authModal("signup");if(banStop())return;
  const p=allFeedPosts().find(x=>x.id===id);if(!p)return;
  const src=p.repost_of?(allFeedPosts().find(x=>x.id===p.repost_of)||p):p;
  const me=cs().uid;if(src.user_id===me)return msg("ده منشورك أصلًا");
  try{await ensureProfile();
    const body={country:src.country||null,city:src.city||"",category:src.category,kind:src.kind||"offer",title:src.title||"",body:src.body||"",phone:src.phone||"",whatsapp:!!src.whatsapp,price:src.price||"",poll:Array.isArray(src.poll)?src.poll:null,images:Array.isArray(src.images)?src.images:[],menu:Array.isArray(src.menu)?src.menu:[],repost_of:src.id,repost_from:src.user_id};
    if(src.video_url)body.video_url=src.video_url;if(src.region)body.region=src.region;
    await sb("/rest/v1/service_posts",{method:"POST",prefer:"return=minimal",body});
    fd.list=null;fd.ts=0;msg("اتشارك المنشور على صفحتك 🔁")}
  catch(e){msg(/duplicate|23505/.test(String(e.message||e))?"شاركته قبل كده":sbErr(e).slice(0,80))}};
const osc=window.svcCard;
window.svcCard=function(e){
  let h=osc.apply(this,arguments);
  if(!e||!SVC_OK.test(e.id||""))return h;
  if(e.repost_from){const p=(cl.pp||{})[e.repost_from]||{};const nm=esc(p.name||"مستخدم");
    h=h.replace('<div class="fh">','<div class="muted" style="padding:6px 12px 0;font-size:13px">🔁 أعاد المشاركة من <b onclick="openUser(\''+e.repost_from+'\')">'+nm+'</b></div><div class="fh">')}
  const k=h.indexOf('<button class="eb" onclick="sharePost(');
  if(k>0)h=h.slice(0,k)+'<button class="eb" onclick="svcRepost(\''+e.id+'\')">🔁 إعادة نشر</button>'+h.slice(k);
  return h};
})();
